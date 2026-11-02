---
title: テンプレートの場所が、基準のフォルダの外に出ていないか確かめる
description: mustache.php の ensureContained は、解決したテンプレートの実際のパスが、許された基準のフォルダの中にあるかを確かめます。../ などでフォルダの外のファイルを読まれる、パス・トラバーサルの攻撃を防ぐための関数です。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Loader/FilesystemLoader.php
lines: [185, 198]
function: ensureContained
difficulty: 3
format: 2
tags: [セキュリティ, 防御的プログラミング, ファイル]
---
## ひとことで

`ensureContained` は、テンプレートのファイルの場所が、許された基準フォルダの中にあるかを確かめる関数です。名前に `../` が混ざっていて、フォルダの外のファイルを指してしまう場合を、読み込む前に止めます。外へ出ていれば、テンプレートが見つからなかったという例外を投げます。

## コード

```php:line-numbers=185
    private function ensureContained($fileName, $name)
    {
        $real = $this->resolveLocalPath($fileName);

        if ($real === false) {
            throw new UnknownTemplateException($name);
        }

        if (strpos($real . DIRECTORY_SEPARATOR, $this->baseDirPrefix) !== 0) {
            throw new UnknownTemplateException($name);
        }

        return $real;
    }
```

## 前提知識

- **パス・トラバーサル**: `../` のような記号を使って、本来の場所より上のフォルダへ移動し、読んではいけないファイルを読ませる攻撃です。テンプレートの名前を外から受け取る場合、特に注意が必要になります。
- **`realpath`**: 相対パスやシンボリックリンクを解決して、実際の絶対パスを返す関数です。存在しないパスには `false` を返します。
- **基準フォルダ（ベースディレクトリ）**: テンプレートを置くことを許したフォルダです。この中にあるファイルだけを読む、という約束を表します。
- **`DIRECTORY_SEPARATOR`**: OS のパスの区切り文字です。Linux では `/`、Windows では `\` になります。
- **`strpos` と接頭辞**: 文字列の先頭が、ある文字列で始まるかを調べる方法です。`strpos` の結果が `0` なら、先頭に一致しています。

## 何をしているか

### 1. 実際のパスを求める

```php:line-numbers=187
        $real = $this->resolveLocalPath($fileName);

        if ($real === false) {
            throw new UnknownTemplateException($name);
        }
```

`resolveLocalPath` で、名前から作ったパスを、`realpath` によって実際の場所にします。`../` や、シンボリックリンクが解決されます。ファイルが存在しなければ `false` になり、この時点で例外にします。

### 2. 基準フォルダの中にあるかを確かめる

```php:line-numbers=193
        if (strpos($real . DIRECTORY_SEPARATOR, $this->baseDirPrefix) !== 0) {
            throw new UnknownTemplateException($name);
        }
```

`$real . DIRECTORY_SEPARATOR` が、`$this->baseDirPrefix`（基準フォルダの後ろに区切りを付けたもの）で始まっているかを調べます。始まっていなければ、基準の外にあるので例外です。

### 3. 問題がなければ、そのパスを返す

```php:line-numbers=197
        return $real;
```

すべての確かめを通ったパスを返します。以後、このパスが読み込まれます。

## ここがすごい

- 文字列の比べ方を、末尾に区切りを付けてから行っています。基準が `/www/templates` のとき、`/www/templates-secret` は通らず、`/www/templates/` で始まるものだけが通ります。よくある、接頭辞の比べ間違いを防いでいます。
- 比べる前に `realpath` で正しい場所に直しているので、`../` やシンボリックリンクを使った抜け道を、同じ土俵で判定できます。
- 確かめに失敗したときは、「テンプレートが見つからない」という同じ例外に揃えています。攻撃者に、ファイルが存在するかどうかの手がかりを与えません。
- 関数は 14 行ほどで、判定の理由が 1 行ずつ読めるように並んでいます。セキュリティに関わる部分ほど、短く明快に書かれています。

## まとめ

`ensureContained` は、テンプレートの実際のパスが基準フォルダの中にあるかを、`realpath` と区切り付きの接頭辞で確かめる関数です。フォルダの外のファイルを読ませない、という約束を、わずかなコードで守っています。外部から来た名前を扱うときの、基本的な防御の型として参考になります。
