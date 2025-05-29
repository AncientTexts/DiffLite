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

    // Variables to track the previous changes and warnings
    let previousTotalChanges = 0;
    let additionWarningShown = false;
    let deletionWarningShown = false;

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
            const additionWarningThreshold = config.get<number>('gitWarningThresholds.addition', 100);
            const deletionWarningThreshold = config.get<number>('gitWarningThresholds.deletion', 300);

            // Reset warning flags at the start of the function
            additionWarningShown = false;
            deletionWarningShown = false;

            // Check for addition warnings
            if (added > additionWarningThreshold && !additionWarningShown) {
                vscode.window.showWarningMessage(`Added lines exceed ${additionWarningThreshold}; consider opening a PR.`);
                additionWarningShown = true;
            }

            // Check for deletion warnings
            if (deleted > deletionWarningThreshold && !deletionWarningShown) {
                vscode.window.showWarningMessage(`Deleted lines exceed ${deletionWarningThreshold}; may be hard to review.`);
                deletionWarningShown = true;
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
