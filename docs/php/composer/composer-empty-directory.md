---
title: フォルダの中身だけを消して、フォルダ自体は残す
description: Composer の Filesystem の emptyDirectory は、フォルダの中のファイルとサブフォルダを消して、空のフォルダを残します。引数によって、フォルダが無いときに作るかどうかも選べます。
language: php
project: Composer
repo: https://github.com/composer/composer
license: MIT
copyright: Copyright (c) Nils Adermann, Jordi Boggiano
commit: "e1460b9e86fee91bf99dfde2dbe9d4fd8e325c1f"
file: src/Composer/Util/Filesystem.php
lines: [72, 93]
function: emptyDirectory
difficulty: 2
format: 2
tags: [ファイル, 防御的プログラミング, 移植性]
---
## ひとことで

`emptyDirectory` は、フォルダの中にあるものを消して、フォルダを空にする関数です。フォルダそのものは消さず、残します。Composer が、パッケージを入れ直す前に、古いファイルを片づけるような場面で使われます。

## コード

```php:line-numbers=72
    public function emptyDirectory(string $dir, bool $ensureDirectoryExists = true)
    {
        if (is_link($dir) && file_exists($dir)) {
            $this->unlink($dir);
        }

        if ($ensureDirectoryExists) {
            $this->ensureDirectoryExists($dir);
        }

        if (is_dir($dir)) {
            $finder = Finder::create()
                ->ignoreVCS(false)
                ->ignoreDotFiles(false)
                ->depth(0)
                ->in($dir);

            foreach ($finder as $path) {
                $this->remove((string) $path);
            }
        }
    }
```

## 前提知識

- **シンボリックリンク**: 別のファイルやフォルダを指す、近道のような特別なファイルです。消すときに、指し先まで消してしまわないように注意が必要です。
- **`is_link` と `file_exists`**: `is_link` はシンボリックリンクかどうかを、`file_exists` はファイルやフォルダが存在するかを調べる関数です。
- **Symfony Finder**: フォルダの中のファイルを、条件をつけて探すライブラリです。`depth(0)` で、直下だけを対象にできます。
- **`ignoreVCS(false)` と `ignoreDotFiles(false)`**: 既定では無視される `.git` のような隠しファイルも、探索の対象に入れる設定です。
- **再帰的な削除**: フォルダの中身を削除するとき、サブフォルダの中まで消す処理です。この関数では、`remove` がそれを担当しています。

## 何をしているか

### 1. シンボリックリンクなら、まず外す

```php:line-numbers=74
        if (is_link($dir) && file_exists($dir)) {
            $this->unlink($dir);
        }
```

`dir` がシンボリックリンクで、指し先が存在するときは、`unlink` でリンクだけを外します。リンクの先のフォルダを消してしまわないように、先に外しています。

### 2. 必要ならフォルダを作る

```php:line-numbers=78
        if ($ensureDirectoryExists) {
            $this->ensureDirectoryExists($dir);
        }
```

第 2 引数の `$ensureDirectoryExists` が `true` のときは、フォルダが無ければ作ります。後で中身を消す作業をするときに、フォルダが無くて失敗しないためです。

### 3. 直下のものを一つずつ消す

```php:line-numbers=82
        if (is_dir($dir)) {
            $finder = Finder::create()
                ->ignoreVCS(false)
                ->ignoreDotFiles(false)
                ->depth(0)
                ->in($dir);

            foreach ($finder as $path) {
                $this->remove((string) $path);
            }
```

フォルダであれば、Finder で直下のファイルとサブフォルダを探します。`ignoreVCS(false)` と `ignoreDotFiles(false)` で、隠しファイルも含めます。見つかったものを、1 つずつ `remove` で消します。`depth(0)` によって、探索は直下だけに限られます。

## ここがすごい

- シンボリックリンクを先に外すことで、リンクの先の大事なフォルダを誤って消す事故を防いでいます。単純な削除より、一段慎重な作りです。
- 隠しファイルを除外しない設定にしているので、`.gitignore` のような見えにくいファイルも、確実に片づけられます。
- 削除を `remove` に任せ、この関数は「何を消すか」だけを決めています。1 つ 1 つの削除の細かな扱い（リンクや権限の違いなど）は、`remove` の側にまとめられています。
- `$ensureDirectoryExists` で、フォルダを作るかどうかを呼び出し側が選べます。用途に応じて、同じ関数を使い分けられます。

## まとめ

`emptyDirectory` は、フォルダの中身を消して、空のフォルダを残す関数です。シンボリックリンクを先に外し、必要ならフォルダを作り、直下のものを 1 つずつ消します。危険な削除を、順番と条件で慎重に行う例として、読みごたえのある処理になっています。
