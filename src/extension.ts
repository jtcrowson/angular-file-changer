"use strict";
import * as vscode from "vscode";

function getFileNameWithoutExtension(path: string) {
  let parts = path.split(".");
  parts.pop();
  if (parts.length > 1) {
    if (parts[parts.length - 1] === "spec") {
      parts.pop();
    }
  }
  return parts.join(".");
}

function isNgRxKey(str: string) {
  switch (str) {
    case 'actions':
    case 'reducer':
    case 'reducers':
    case 'effects':
      return true;
    default:
      return false;
  }
}

interface NgRxType {
  pathName: string;
  fileExtension: string;
}

function getFileNameWithNgrxExtension(path: string, type: NgRxType) {
  let pathElements = path.split("/");
  let fileName = pathElements.pop() || '';
  let fileParent = pathElements.pop() || '';
  if (isNgRxKey(fileParent)) {
    pathElements.push(type.pathName);
  } else {
    pathElements.push(fileParent);
  }
  let fileNameElements = fileName.split('.') || '';
  let fileExtension = fileNameElements.pop() || '';
  let fileSecondaryExtension = fileNameElements.pop() || '';
  if (fileSecondaryExtension === "spec") {
    fileSecondaryExtension = fileNameElements.pop() || '';
  }
  if (isNgRxKey(fileSecondaryExtension)) {
    fileNameElements.push(type.fileExtension);
  } else {
    fileNameElements.push(fileSecondaryExtension);
  }
  fileNameElements.push(fileExtension);
  let newFileName = fileNameElements.join('.');
  pathElements.push(newFileName);
  return pathElements.join('/');
}

let isSplit = vscode.workspace
  .getConfiguration("angular-file-changer")
  .get<boolean>("openSideBySide");

vscode.workspace.onDidChangeConfiguration(() => {
  isSplit = vscode.workspace
    .getConfiguration("angular-file-changer")
    .get("openSideBySide");
});

function xOpenTextDocument(
  path: string,
  viewColumn?: vscode.ViewColumn
): Promise<vscode.TextDocument> {
  return new Promise((resolve, reject) => {
    let opened = false;
    vscode.window.visibleTextEditors.forEach(textEditor => {
      if (textEditor.document.fileName === path) {
        opened = true;
        vscode.window
          .showTextDocument(textEditor.document, textEditor.viewColumn)
          .then(
            () => {
              resolve(textEditor.document);
            },
            err => {
              reject(err);
            }
          );
      }
    });

    if (!opened) {
      vscode.workspace.openTextDocument(path).then(
        doc => {
          vscode.window.showTextDocument(doc, viewColumn).then(
            () => {
              resolve(doc);
            },
            err => {
              reject(err);
            }
          );
        },
        err => {
          reject(err);
        }
      );
    }
  });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "angular-file-changer" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let cmdswitchHTML = vscode.commands.registerCommand(
    "extension.switchHTML",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      // vscode.window.showInformationMessage('Hello World!');

      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const fileNameWithoutExtension = getFileNameWithoutExtension(currentFile);
      const targetFile = fileNameWithoutExtension + ".html";

      xOpenTextDocument(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      ).then(
        () => {},
        err => {
          //vscode.workspace.findFiles('**∕*.js', '**∕node_modules∕**', 10);
          vscode.window.showInformationMessage('Could not find file \'' + targetFile.split('/').pop() + '\'');
        }
      );
    }
  );

  let cmdswitchTypeScript = vscode.commands.registerCommand(
    "extension.switchTypeScript",
    () => {
      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const fileNameWithoutExtension = getFileNameWithoutExtension(currentFile);
      const targetFile = fileNameWithoutExtension + ".ts";

      xOpenTextDocument(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      ).then(
        () => {},
        err => {
          vscode.window.showInformationMessage('Could not find file \'' + targetFile.split('/').pop() + '\'');
        }
      );
    }
  );

  let cmdswitchCSS = vscode.commands.registerCommand(
    "extension.switchCSS",
    () => {
      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const fileNameWithoutExtension = getFileNameWithoutExtension(currentFile);
      const targetFile: string[] = [];
      targetFile.push(fileNameWithoutExtension + ".scss");
      targetFile.push(fileNameWithoutExtension + ".sass");
      targetFile.push(fileNameWithoutExtension + ".less");
      targetFile.push(fileNameWithoutExtension + ".css");

      var g = gen(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      );
      let numStyleExtensionsToCheck = targetFile.length;
      function next() {
        var result = g.next();
        if (result.done) {
          return;
        }
        result.value.then(
          () => {
            return;
          },
          err => {
            numStyleExtensionsToCheck--;
            if (numStyleExtensionsToCheck === 0) {
              vscode.window.showInformationMessage('Could not find file \'' + fileNameWithoutExtension.split('/').pop() + '\' with .css, .scss, .sass, or .less extension');
            }
            next();
          }
        );
      }

      next();
    }
  );

  // will jump *.spec.ts only current within *.ts
  let cmdswitchTest = vscode.commands.registerCommand(
    "extension.switchTest",
    () => {
      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const fileNameWithoutExtension = getFileNameWithoutExtension(currentFile);
      const targetFile = fileNameWithoutExtension + ".spec.ts";


      xOpenTextDocument(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      ).then(
        () => {},
        err => {
          vscode.window.showInformationMessage('Could not find file \'' + targetFile.split('/').pop() + '\'');
        }
      );
    }
  );

  let cmdSwitchAction = vscode.commands.registerCommand(
    "extension.switchAction",
    () => {
      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const targetFile = getFileNameWithNgrxExtension(currentFile, { pathName: 'actions', fileExtension: 'actions' });

      xOpenTextDocument(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      ).then(
        () => {},
        err => {
          vscode.window.showInformationMessage('Could not find file \'' + targetFile.split('/').pop() + '\'');
        }
      );
    }
  );

  let cmdSwitchEffect = vscode.commands.registerCommand(
    "extension.switchEffect",
    () => {
      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const targetFile = getFileNameWithNgrxExtension(currentFile, { pathName: 'effects', fileExtension: 'effects' });

      xOpenTextDocument(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      ).then(
        () => {},
        err => {
          vscode.window.showInformationMessage('Could not find file \'' + targetFile.split('/').pop() + '\'');
        }
      );
    }
  );

  let cmdSwitchReducer = vscode.commands.registerCommand(
    "extension.switchReducer",
    () => {
      if (!vscode.workspace) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentFile = editor.document.fileName;
      const targetFile = getFileNameWithNgrxExtension(currentFile, { pathName: 'reducers', fileExtension: 'reducer' });

      xOpenTextDocument(
        targetFile,
        isSplit ? vscode.ViewColumn.Two : editor.viewColumn
      ).then(
        () => {},
        err => {
          vscode.window.showInformationMessage('Could not find file \'' + targetFile.split('/').pop() + '\'');
        }
      );
    }
  );

  context.subscriptions.push(cmdswitchHTML, cmdswitchCSS, cmdswitchTypeScript, cmdswitchTest, cmdSwitchAction, cmdSwitchEffect, cmdSwitchReducer);
}

function* gen(files: string[], viewColumn: vscode.ViewColumn | undefined) {
  for (var index = 0; index < files.length; index++) {
    yield xOpenTextDocument(files[index], viewColumn);
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
