import { prisma } from '@hivora/db';
import { io } from '../index.js';
import { emitEvent } from '../realtime/index.js';
import fs from 'fs';
import path from 'path';
import { aiService } from './ai.js';
import { GitService } from './git.service.js';
import { execSync } from 'child_process';

// Approximate USD pricing per 1M tokens for the server-side AI providers
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'claude-opus-4-1': { input: 15.00, output: 75.00 },
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'command-r-plus': { input: 2.50, output: 10.00 },
  'command-r': { input: 0.50, output: 1.50 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const key = model.toLowerCase();
  const price = MODEL_PRICING[key] ?? { input: 2.5, output: 10 };
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

// Helper function to scan files and symbols in a project path
function getProjectSymbols(projectPath: string): { file: string; symbols: string[] }[] {
  const files: { file: string; symbols: string[] }[] = [];
  
  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        if (['node_modules', 'dist', '.git', '.next', 'out', 'build'].includes(item)) continue;
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const functionRegex = /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g;
            const constRegex = /export\s+const\s+([a-zA-Z0-9_]+)/g;
            const classRegex = /export\s+class\s+([a-zA-Z0-9_]+)/g;
            
            const symbols: string[] = [];
            let match;
            
            while ((match = functionRegex.exec(content)) !== null) symbols.push(match[1]);
            while ((match = constRegex.exec(content)) !== null) symbols.push(match[1]);
            while ((match = classRegex.exec(content)) !== null) symbols.push(match[1]);

            if (symbols.length > 0) {
              files.push({
                file: path.relative(projectPath, fullPath).replace(/\\/g, '/'),
                symbols
              });
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  scan(projectPath);
  return files;
}

let interval: NodeJS.Timeout | null = null;

export function startAgentSimulation() {
  if (interval) return;
  console.log('[AgentService] Starting Agent Simulation Motor...');

  interval = setInterval(async () => {
    try {
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let usedProvider = '';
      let usedModel = '';

      const addUsage = (response: { usage?: { inputTokens: number; outputTokens: number } }) => {
        if (response.usage) {
          totalInputTokens += response.usage.inputTokens;
          totalOutputTokens += response.usage.outputTokens;
        }
      };

      // 1. Find an idle agent
      const idleAgent = await prisma.agent.findFirst({
        where: { status: 'idle', type: 'ai' },
      });

      if (!idleAgent) return; // No idle agents available

      // 2. Find a todo task in the same project
      const todoTask = await prisma.task.findFirst({
        where: { projectId: idleAgent.projectId, status: 'todo' },
        orderBy: { createdAt: 'asc' }, // Get oldest task
      });

      if (!todoTask) return; // No tasks to do

      // Get project to fetch organizationId
      const project = await prisma.project.findUnique({
        where: { id: idleAgent.projectId },
        select: { organizationId: true, path: true },
      });
      if (!project) return;

      const orgId = project.organizationId;

      console.log(`[AgentService] Agent ${idleAgent.name} picking up task ${todoTask.id}`);

      // 3. Update task to 'doing' and agent to 'working'
      const updatedTask = await prisma.task.update({
        where: { id: todoTask.id },
        data: { status: 'doing', assigneeId: idleAgent.id },
      });

      const updatedAgent = await prisma.agent.update({
        where: { id: idleAgent.id },
        data: { status: 'working', currentTask: todoTask.title },
      });

      // Emit events
      emitEvent(io, {
        type: 'task:updated',
        projectId: todoTask.projectId,
        organizationId: orgId,
        payload: { task: updatedTask },
      } as any);

      emitEvent(io, {
        type: 'agent:updated',
        projectId: idleAgent.projectId,
        organizationId: orgId,
        payload: { agent: updatedAgent },
      } as any);

      // 4. Dynamic Lock creation via LLM or fallback
      let lockFile = 'src/App.tsx';
      let lockSymbol = 'App';

      // Attempt to read project path and scan files
      const projectPath = project.path || process.cwd();
      
      const emitLog = (msg: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        console.log(`[AgentService][Log][${level}] ${idleAgent.name}: ${msg}`);
        emitEvent(io, {
          type: 'agent:log',
          projectId: idleAgent.projectId,
          organizationId: orgId,
          payload: { agentId: idleAgent.id, message: msg, timestamp: new Date().toISOString(), level },
        } as any);
      };

      emitLog(`Görev devralındı, hazırlık yapılıyor...`);

      // Checkout git branch for the task
      try {
        emitLog(`Yerel Git branch'i oluşturuluyor: agents/doing/task-${todoTask.id}`);
        GitService.checkoutTaskBranch(projectPath, todoTask.id);
      } catch (err) {
        console.warn('[AgentService] Git checkout failed:', err);
        emitLog(`Git branch geçiş hatası: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }

      emitLog(`Yerel dosya sistemi taranıyor ve semboller analiz ediliyor...`);
      const projectFiles = getProjectSymbols(projectPath);

      if (projectFiles.length > 0) {
        emitLog(`Yapay zeka modeli ile sembol kilit tespiti yapılıyor... (Mod: ${idleAgent.mode})`);
        // Try calling LLM to make a decision
        try {
          const availableProviders = aiService.getAvailableProviders();
          if (availableProviders.length > 0) {
            // Choose model based on mode
            const provider = idleAgent.mode === 'fast'
              ? (availableProviders.includes('openai') ? 'openai' : availableProviders[0])
              : (availableProviders.includes('anthropic') ? 'anthropic' : availableProviders[0]);
            
            const messages = [
              {
                role: 'system' as const,
                content: 'You are Hivora AI coordinator. Decide which file and symbol must be locked/edited for the task. Output ONLY valid JSON.',
              },
              {
                role: 'user' as const,
                content: `Task: ${todoTask.title}\nDescription: ${todoTask.description || ''}\n\nProject Files & Symbols:\n${JSON.stringify(projectFiles, null, 2)}\n\nRespond ONLY with JSON format: {"file": "file_path", "symbol": "symbol_name"}`,
              }
            ];

            const response = await aiService.complete(messages, provider, { temperature: 0.1 });
            addUsage(response);
            usedProvider = response.provider;
            usedModel = response.model;
            const parsed = JSON.parse(response.content.trim());
            if (parsed.file && parsed.symbol) {
              lockFile = parsed.file;
              lockSymbol = parsed.symbol;
              console.log(`[AgentService] LLM selected Lock: ${lockSymbol} in ${lockFile}`);
            }
          } else {
            throw new Error('No AI providers configured');
          }
        } catch (e) {
          // Fallback to choosing a random scanned symbol
          const randomFile = projectFiles[Math.floor(Math.random() * projectFiles.length)];
          const randomSymbol = randomFile.symbols[Math.floor(Math.random() * randomFile.symbols.length)];
          lockFile = randomFile.file;
          lockSymbol = randomSymbol;
          console.log(`[AgentService] LLM fallback selected Lock: ${lockSymbol} in ${lockFile}`);
        }
      }

      emitLog(`Kilitleme işlemi tamamlandı: ${lockFile} içerisindeki ${lockSymbol} sembolü korumaya alındı.`, 'success');

      const lock = await prisma.lock.create({
        data: {
          projectId: idleAgent.projectId,
          agentId: idleAgent.id,
          file: lockFile,
          symbol: lockSymbol,
        },
      });

      emitEvent(io, {
        type: 'lock:acquired',
        projectId: idleAgent.projectId,
        organizationId: orgId,
        payload: { lock },
      } as any);

      // 5. Simulate work (code modification + verification)
      const workDuration = Math.floor(Math.random() * 5000) + 5000;
      setTimeout(async () => {
        emitLog(`Kod yazma aşamasına geçiliyor. Hedef dosya: ${lockFile}`);
        const fullFilePath = path.join(projectPath, lockFile);
        let currentContent = '';
        
        try {
          if (fs.existsSync(fullFilePath)) {
            currentContent = fs.readFileSync(fullFilePath, 'utf8');
            let updatedContent = '';
            
            // Try calling LLM to write the code
            try {
              const availableProviders = aiService.getAvailableProviders();
              if (availableProviders.length > 0) {
                // Choose model based on mode
                const provider = idleAgent.mode === 'fast'
                  ? (availableProviders.includes('openai') ? 'openai' : availableProviders[0])
                  : (availableProviders.includes('anthropic') ? 'anthropic' : availableProviders[0]);

                emitLog(`Yapay zeka kodu yazıyor... (${provider.toUpperCase()} modeli kullanılıyor)`);

                const prompt = `You are an AI developer. You are completing this task: "${todoTask.title}"
Task Description: "${todoTask.description || ''}"
Locked Symbol: "${lockSymbol}"

Here is the current content of "${lockFile}":
\`\`\`ts
${currentContent}
\`\`\`

Generate the updated file contents. Respond ONLY with the complete, updated file content. Do not include markdown code block fences, explanations, or any other text.`;
                const response = await aiService.complete([{ role: 'user', content: prompt }], provider, { temperature: 0.2 });
                addUsage(response);
                usedProvider = response.provider;
                usedModel = response.model;
                updatedContent = response.content.trim();
              } else {
                throw new Error('No AI providers configured');
              }
            } catch (llmErr) {
              // Fallback: Append comment to trigger code write
              updatedContent = currentContent + `\n// Task completed by ${idleAgent.name}: ${todoTask.title}\n`;
            }

            // Write modified code temporarily for typecheck
            fs.writeFileSync(fullFilePath, updatedContent, 'utf8');
            emitLog(`Kod doğrulama için geçici olarak diske yazıldı.`);

            // Verification & Self-Healing (Only in thinking mode)
            const healingAttempts: Array<{ id: string; error: string; fix: string; status: 'attempting' | 'success' | 'failed'; timestamp: number }> = [];
            const emitHealing = (status: 'running' | 'success' | 'failed') => {
              emitEvent(io, {
                type: 'agent:healing',
                projectId: idleAgent.projectId,
                organizationId: orgId,
                payload: { agentId: idleAgent.id, taskId: todoTask.id, file: lockFile, attempts: healingAttempts, status },
              } as any);
              // Persist healing session so the UI can replay it on reconnect
              try {
                const healingDir = path.join(projectPath, '.hivora', 'healing');
                fs.mkdirSync(healingDir, { recursive: true });
                fs.writeFileSync(
                  path.join(healingDir, `task-${todoTask.id}.json`),
                  JSON.stringify({ taskId: todoTask.id, file: lockFile, attempts: healingAttempts, status, updatedAt: Date.now() }),
                  'utf8'
                );
              } catch {}
            };

            if (idleAgent.mode === 'thinking') {
              let compileSuccess = false;
              let compileError = '';
              const maxAttempts = 3;

              for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                emitLog(`Derleme kontrolü ve tip doğrulaması yapılıyor... (deneme ${attempt}/${maxAttempts})`);
                try {
                  execSync('npx tsc --noEmit', { cwd: projectPath, stdio: 'ignore' });
                  compileSuccess = true;
                  emitLog(`Derleme doğrulandı: 0 hata.`, 'success');
                  break;
                } catch (e) {
                  compileError = e instanceof Error ? e.message : String(e);
                  emitLog(`Derleme hatası tespit edildi! Self-Healing denemesi ${attempt}/${maxAttempts} başlatılıyor...`, 'warning');
                  healingAttempts.push({ id: `attempt-${attempt}`, error: compileError, fix: '', status: 'attempting', timestamp: Date.now() });
                  emitHealing('running');

                  try {
                    const availableProviders = aiService.getAvailableProviders();
                    if (availableProviders.length > 0) {
                      const provider = availableProviders.includes('anthropic') ? 'anthropic' : availableProviders[0];
                      const prompt = `You modified "${lockFile}" but it caused compilation errors:
${compileError}

Here is the current content of the file:
\`\`\`ts
${updatedContent}
\`\`\`

Fix the errors and generate the correct file contents. Respond ONLY with the complete, updated file content. Do not include markdown code block fences or explanations.`;
                    const response = await aiService.complete([{ role: 'user', content: prompt }], provider, { temperature: 0.1 });
                    addUsage(response);
                    usedProvider = response.provider || usedProvider;
                    usedModel = response.model || usedModel;
                    updatedContent = response.content.trim();
                    fs.writeFileSync(fullFilePath, updatedContent, 'utf8');
                    const last = healingAttempts[healingAttempts.length - 1];
                    if (last) { last.fix = `Applied compiler-error fix (attempt ${attempt})`; last.status = 'success'; }
                      emitLog(`Self-Healing denemesi ${attempt} tamamlandı, düzeltilmiş kod yazıldı.`, 'success');
                    } else {
                      throw new Error('No AI providers configured');
                    }
                  } catch (healErr) {
                    const last = healingAttempts[healingAttempts.length - 1];
                    if (last) { last.fix = `Fix attempt ${attempt} failed`; last.status = 'failed'; }
                    console.error('[AgentService] Self-healing attempt failed:', healErr);
                    emitLog(`İyileştirme hatası: ${healErr instanceof Error ? healErr.message : String(healErr)}`, 'error');
                    break;
                  }
                }
              }

              if (!compileSuccess && healingAttempts.length > 0) {
                emitHealing('failed');
              } else if (compileSuccess && healingAttempts.length > 0) {
                emitHealing('success');
              }
            } else {
              emitLog(`Bypass: Fast mod devrede, derleme doğrulaması atlandı.`);
            }

            // Read the final content we want to propose
            const finalProposedContent = fs.readFileSync(fullFilePath, 'utf8');

            // Restore original content immediately
            fs.writeFileSync(fullFilePath, currentContent, 'utf8');
            emitLog(`Dosya eski haline döndürüldü. Değişiklikler onay bekliyor durumuna getiriliyor...`);

            // Save to pending JSON file
            const pendingDir = path.join(projectPath, '.hivora', 'pending-tasks');
            fs.mkdirSync(pendingDir, { recursive: true });
            const pendingFilePath = path.join(pendingDir, `task-${todoTask.id}.json`);
            const finalCost = calculateCost(usedModel, totalInputTokens, totalOutputTokens);
            fs.writeFileSync(pendingFilePath, JSON.stringify({
              file: lockFile,
              symbol: lockSymbol,
              proposedContent: finalProposedContent,
              agentId: idleAgent.id,
              lockId: lock.id,
              orgId: orgId,
              healingAttempts,
              analytics: {
                provider: usedProvider,
                model: usedModel,
                mode: idleAgent.mode,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                cost: finalCost,
              },
            }), 'utf8');

            // Transition task to review_pending
            const reviewTask = await prisma.task.update({
              where: { id: todoTask.id },
              data: { status: 'review_pending' },
            });

            emitLog(`Görev inceleme bekliyor (Review Pending). Lütfen değişiklikleri onaylayın.`, 'warning');

            // Emit task updated event
            emitEvent(io, {
              type: 'task:updated',
              projectId: reviewTask.projectId,
              organizationId: orgId,
              payload: { task: reviewTask },
            } as any);
          }
        } catch (fileErr) {
          console.error('[AgentService] Error modifying file:', fileErr);
          emitLog(`Dosya düzenleme hatası: ${fileErr instanceof Error ? fileErr.message : String(fileErr)}`, 'error');
          
          // Restore original if possible
          if (fs.existsSync(fullFilePath)) {
            try {
              const currentVal = fs.readFileSync(fullFilePath, 'utf8');
              if (currentVal !== currentContent) {
                fs.writeFileSync(fullFilePath, currentContent, 'utf8');
              }
            } catch (e) {}
          }

          // Mark task as todo (failed)
          const failedTask = await prisma.task.update({
            where: { id: todoTask.id },
            data: { status: 'todo', assigneeId: null },
          });

          const freeAgent = await prisma.agent.update({
            where: { id: idleAgent.id },
            data: { status: 'idle', currentTask: null },
          });

          await prisma.lock.delete({ where: { id: lock.id } }).catch(() => {});

          emitEvent(io, {
            type: 'task:updated',
            projectId: failedTask.projectId,
            organizationId: orgId,
            payload: { task: failedTask },
          } as any);

          emitEvent(io, {
            type: 'agent:updated',
            projectId: freeAgent.projectId,
            organizationId: orgId,
            payload: { agent: freeAgent },
          } as any);

          emitEvent(io, {
            type: 'lock:released',
            projectId: lock.projectId,
            organizationId: orgId,
            payload: { lockId: lock.id },
          } as any);
        }
      }, workDuration);

    } catch (error) {
      console.error('[AgentService] Error in simulation loop', error);
    }
  }, 5000);
}

export function stopAgentSimulation() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log('[AgentService] Stopped Agent Simulation Motor.');
  }
}
