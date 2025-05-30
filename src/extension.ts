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
    let additionWarningShown = false;
    let additionCriticalShown = false;
    let deletionWarningShown = false;
    let deletionCriticalShown = false;

	// Function to update the status bar with line changes
	async function updateLineChanges() {
		try {
			const unstaged = await git.diffSummary();
			const staged = await git.diffSummary(['--cached']);

			let added = unstaged.insertions + staged.insertions;
			let deleted = unstaged.deletions + staged.deletions;

            // Fetch settings
            const config = vscode.workspace.getConfiguration('difflite');
            const compareWithBranchEnabled = config.get<boolean>('compareWithBranch.enabled', false);
            const compareWithBranch = config.get<string>('compareWithBranch.branch', 'main');

            if (compareWithBranchEnabled) {
                try {
                    const branchDiff = await git.diffSummary([compareWithBranch]);
                    added += branchDiff.insertions;
                    deleted += branchDiff.deletions;
                } catch (branchError) {
                    console.error(`Error comparing with branch ${compareWithBranch}:`, branchError);
                }
            }

            statusBarItem.text = `$(diff-added) +${added} $(diff-removed) -${deleted}`;
            statusBarItem.tooltip = 'Git Changes';
            statusBarItem.show();

            // Fetch warning thresholds from settings
            const additionsWarningThreshold = config.get<number>('gitWarningThresholds.additionsWarning', 100);
            const additionsCriticalThreshold = config.get<number>('gitWarningThresholds.additionsCritical', 150);
            const deletionsWarningThreshold = config.get<number>('gitWarningThresholds.deletionsWarning', 300);
            const deletionsCriticalThreshold = config.get<number>('gitWarningThresholds.deletionsCritical', 500);

            // Check for addition warnings and criticals
            if (added > additionsCriticalThreshold && !additionCriticalShown) {
                vscode.window.showWarningMessage(`Added lines exceed ${additionsCriticalThreshold}; may be hard to review.`);
                additionCriticalShown = true;
                additionWarningShown = true; // Ensure warning is also considered shown
            } else if (added > additionsWarningThreshold && !additionWarningShown) {
                vscode.window.showWarningMessage(`Added lines exceed ${additionsWarningThreshold}; consider opening a PR.`);
                additionWarningShown = true;
            }

            // Check for deletion warnings and criticals
            if (deleted > deletionsCriticalThreshold && !deletionCriticalShown) {
                vscode.window.showWarningMessage(`Deleted lines exceed ${deletionsCriticalThreshold}; may be hard to review.`);
                deletionCriticalShown = true;
                deletionWarningShown = true; // Ensure warning is also considered shown
            } else if (deleted > deletionsWarningThreshold && !deletionWarningShown) {
                vscode.window.showWarningMessage(`Deleted lines exceed ${deletionsWarningThreshold}; consider opening a PR.`);
                deletionWarningShown = true;
            }

            // Reset warning flags if thresholds are no longer breached
            if (added <= additionsWarningThreshold) {
                additionWarningShown = false;
            }
            if (added <= additionsCriticalThreshold) {
                additionCriticalShown = false;
            }
            if (deleted <= deletionsWarningThreshold) {
                deletionWarningShown = false;
            }
            if (deleted <= deletionsCriticalThreshold) {
                deletionCriticalShown = false;
            }

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
