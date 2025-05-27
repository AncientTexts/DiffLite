// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import simpleGit from 'simple-git';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "difflite" is now active!');

	// Create a status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);

    const git = simpleGit(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');

    // Variable to track the previous total changes
    let previousTotalChanges = 0;

	// Function to update the status bar with line changes
	async function updateLineChanges() {
		try {
			const unstaged = await git.diffSummary();
			const staged = await git.diffSummary(['--cached']);

			const added = unstaged.insertions + staged.insertions;
			const deleted = unstaged.deletions + staged.deletions;

            statusBarItem.text = `$(diff-added) +${added} $(diff-removed) -${deleted}`;
            statusBarItem.tooltip = 'Git Changes';
            statusBarItem.show();

            const totalChanges = added + deleted;

            // Fetch warning thresholds from settings
            const config = vscode.workspace.getConfiguration('difflite');
            const smallThreshold = config.get<number>('gitWarningThresholds.small', 100);
            const largeThreshold = config.get<number>('gitWarningThresholds.large', 150);

            // Check for range transitions and show warnings accordingly
            if (previousTotalChanges <= smallThreshold && totalChanges > smallThreshold && totalChanges <= largeThreshold) {
                vscode.window.showWarningMessage('Commit is large; consider opening a PR.');
            } else if (previousTotalChanges <= largeThreshold && totalChanges > largeThreshold) {
                vscode.window.showWarningMessage('Commit exceeds 150 lines; may be hard to review.');
            }

            // Update the previous total changes
            previousTotalChanges = totalChanges;

		} catch (error) {
			console.error('Error fetching git diff:', error);
			statusBarItem.text = 'Error fetching changes';
            statusBarItem.hide();
		}
	}
	// Update line changes on activation
	updateLineChanges();

	// Register an event listener to update line changes on file save
	const saveEventListener = vscode.workspace.createFileSystemWatcher('**');
    context.subscriptions.push(
        saveEventListener.onDidCreate(updateLineChanges),
        saveEventListener.onDidDelete(updateLineChanges),
        vscode.workspace.onDidSaveTextDocument(updateLineChanges),
        vscode.workspace.onDidChangeWorkspaceFolders(updateLineChanges)
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
