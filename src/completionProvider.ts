import * as vscode from 'vscode';

// EUI关键词补全项
const keywordCompletions: vscode.CompletionItem[] = [
  { label: 'window', kind: vscode.CompletionItemKind.Keyword, detail: '窗口配置' },
  { label: 'label', kind: vscode.CompletionItemKind.Keyword, detail: '文字标签' },
  { label: 'entry', kind: vscode.CompletionItemKind.Keyword, detail: '输入框' },
  { label: 'button', kind: vscode.CompletionItemKind.Keyword, detail: '按钮' },
  { label: 'image', kind: vscode.CompletionItemKind.Keyword, detail: '图片' },
  { label: 'combo', kind: vscode.CompletionItemKind.Keyword, detail: '下拉框' },
  { label: 'slider', kind: vscode.CompletionItemKind.Keyword, detail: '滑块' },
  { label: 'timer', kind: vscode.CompletionItemKind.Keyword, detail: '定时器' }
];

// 参数补全项（按关键词分组）
const paramCompletions: Record<string, vscode.CompletionItem[]> = {
  'window': [
    { label: 'title', kind: vscode.CompletionItemKind.Field, detail: '窗口标题' },
    { label: 'width', kind: vscode.CompletionItemKind.Field, detail: '宽度' },
    { label: 'height', kind: vscode.CompletionItemKind.Field, detail: '高度' }
  ],
  'button': [
    { label: 'text', kind: vscode.CompletionItemKind.Field, detail: '按钮文字' },
    { label: 'id', kind: vscode.CompletionItemKind.Field, detail: '组件ID' },
    { label: 'click', kind: vscode.CompletionItemKind.Field, detail: '点击事件' }
  ],
  'image': [
    { label: 'path', kind: vscode.CompletionItemKind.Field, detail: '图片路径' },
    { label: 'url', kind: vscode.CompletionItemKind.Field, detail: '图片URL' },
    { label: 'width', kind: vscode.CompletionItemKind.Field, detail: '宽度' }
  ]
};

// 事件动作补全（如click="play_audio=xxx"）
const actionCompletions: vscode.CompletionItem[] = [
  { label: 'play_audio=', kind: vscode.CompletionItemKind.Function, detail: '播放音频' },
  { label: '显示=', kind: vscode.CompletionItemKind.Function, detail: '显示组件值' },
  { label: 'start_timer=', kind: vscode.CompletionItemKind.Function, detail: '启动定时器' }
];

export class EUICompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const line = document.lineAt(position).text.substring(0, position.character);
    
    // 1. 补全关键词（如输入"win"提示"window"）
    if (!line.includes('=')) {
      return keywordCompletions;
    }

    // 2. 补全参数（如"window="后提示"title="）
    const keywordMatch = line.match(/(\w+)\s*=/);
    if (keywordMatch && paramCompletions[keywordMatch[1]]) {
      return paramCompletions[keywordMatch[1]].map(item => {
        item.insertText = `${item.label}="`; // 自动补全引号
        return item;
      });
    }

    // 3. 补全事件动作（如click="后提示"play_audio="）
    if (line.includes('click="')) {
      return actionCompletions;
    }

    return [];
  }
}
