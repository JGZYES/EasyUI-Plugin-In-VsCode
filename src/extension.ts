import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { EUICompletionProvider } from './completionProvider';

export function activate(context: vscode.ExtensionContext) {
  // 1. 注册代码补全功能
  // 1. 注册代码补全功能
  const completionProvider = new EUICompletionProvider();
  const completionDisposable = vscode.languages.registerCompletionItemProvider(
    'eui',  // 关联EUI语言
    completionProvider,
    '=', '"', ' ', ',', '.', '('  // 所有触发字符放在同一行，避免末尾逗号问题
  );

  // 2. 注册运行EUI文件的命令（支持.eui和.ewui）
  const runDisposable = vscode.commands.registerCommand('eui.run', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage('请打开一个文件！');
      return;
    }

    const document = activeEditor.document;
    const fileName = document.fileName;

    // 验证文件后缀（.eui或.ewui）
    if (!fileName.endsWith('.eui') && !fileName.endsWith('.ewui')) {
      vscode.window.showErrorMessage('请打开.eui或.ewui文件！');
      return;
    }

    // 保存文件（避免运行旧内容）
    await document.save();

    // 3. 检查EUI解释器是否存在
    const interpreterPath = path.join(context.extensionPath, 'easy_ui_interpreter.py');
    if (!fs.existsSync(interpreterPath)) {
      vscode.window.showErrorMessage(`未找到EUI解释器：\n${interpreterPath}\n请将解释器放在插件根目录！`);
      return;
    }

    // 4. 自动检测Python路径（兼容多系统）
    let pythonPath: string | null = null;
    const possiblePythonPaths = [
      'python',       // Windows默认
      'python3',      // Mac/Linux默认
      'py',           // Windows别名
      '/usr/bin/python3',  // Linux常见路径
      '/usr/local/bin/python3'  // Mac常见路径
    ];

    // 优先使用用户配置的Python路径
    const pythonConfig = vscode.workspace.getConfiguration('python');
    const userPythonPath = pythonConfig.get<string>('defaultInterpreterPath');
    if (userPythonPath && fs.existsSync(userPythonPath)) {
      pythonPath = userPythonPath;
    } else {
      // 自动检测系统中的Python
      for (const p of possiblePythonPaths) {
        try {
          cp.execSync(`${p} --version`, { stdio: 'ignore' });
          pythonPath = p;
          break;
        } catch {
          continue;
        }
      }
    }

    if (!pythonPath) {
      vscode.window.showErrorMessage('未找到Python解释器！请安装Python并配置环境变量。');
      return;
    }

    // 5. 执行EUI文件
    try {
      const process = cp.spawn(pythonPath, [interpreterPath, fileName]);

      // 输出Python日志（调试用）
      process.stdout.on('data', (data) => {
        console.log(`[EUI输出] ${data.toString().trim()}`);
      });

      // 捕获Python错误
      process.stderr.on('data', (data) => {
        const errorMsg = data.toString().trim();
        console.error(`[Python错误] ${errorMsg}`);
        vscode.window.showErrorMessage(`运行错误：${errorMsg.slice(0, 150)}`);
      });

      // 进程退出处理
      process.on('close', (code) => {
        if (code === 0) {
          vscode.window.showInformationMessage('EUI窗口已启动！');
        } else {
          vscode.window.showErrorMessage(`进程已退出，代码：${code}`);
        }
      });

    } catch (err: any) {
      vscode.window.showErrorMessage(`启动失败：${err.message}`);
    }
  });

  // 注册到插件上下文（卸载时自动清理）
  context.subscriptions.push(completionDisposable, runDisposable);
}

// 插件卸载时执行
export function deactivate() {
  console.log('EUI Editor插件已卸载');
}