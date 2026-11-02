---
title: 接頭辞を外して、フォルダの末尾の区切りも消す
description: Flysystem の stripDirectoryPrefix は、保存先の接頭辞を取り除いてから、末尾に残った \ や / を消します。内部のパスを、利用者に見せる形へ戻す逆変換の関数です。
language: php
project: Flysystem
repo: https://github.com/thephpleague/flysystem
license: MIT
copyright: Copyright (c) 2013-2026 Frank de Jonge
commit: "1e748897e0a8e897b5a8bc8942e05f4f57fa248c"
file: src/PathPrefixer.php
lines: [35, 38]
function: PathPrefixer::stripDirectoryPrefix
difficulty: 1
format: 2
tags: [文字列処理, ファイル, API設計]
---
## ひとことで

`stripDirectoryPrefix` は、ストレージの中の完全なパスから、保存先の接頭辞を取り除き、フォルダ名として返す関数です。`prefixDirectoryPath` の逆向きの変換で、一覧の結果などを利用者に返すときに使われます。

## コード

```php:line-numbers=35
    public function stripDirectoryPrefix(string $path): string
    {
        return rtrim($this->stripPrefix($path), '\\/');
    }
```

## 前提知識

- **逆変換**: ある処理で付けたものを、元に戻す処理のことです。付ける関数と外す関数を、対で用意するのが一般的です。
- **`rtrim`**: 右端にある指定の文字を取り除く関数です。`'\\/'` は `\` と `/` の 2 文字を指します。
- **`$this->stripPrefix`**: 接頭辞を取り除くメソッドです。先頭の文字数を見て、その分を切り落とします。
- **`substr`**: 文字列の一部を取り出す関数です。`substr('uploads/a', 8)` は `a` を返します。
- **メソッドの委譲**: 1 つのメソッドが、別のメソッドの結果に処理を足して返す形です。

## 何をしているか

### 1. 接頭辞を取り除く

```php:line-numbers=37
        return rtrim($this->stripPrefix($path), '\\/');
```

内側の `$this->stripPrefix($path)` が先に動きます。`stripPrefix` は、接頭辞の長さ分だけ先頭を切り落とします。`uploads/photos/` から `uploads/` を取り除くと `photos/` が残ります。

### 2. 末尾の区切りを消す

同じ行の `rtrim(..., '\\/')` が、末尾の `/` を消します。`photos/` は `photos` になります。

フォルダの「利用者向けの名前」には末尾の区切りを含めない、という決まりに合わせています。

## ここがすごい

- **対になる関数との整合**: `prefixDirectoryPath` は末尾に `/` を付け、この関数は末尾の `/` を消します。付ける側と外す側で決まりを揃えているので、往復させても元に戻ります。
- **分けて書いた役割**: 接頭辞の除去は `stripPrefix` に任せ、この関数は末尾の処理だけを足しています。読み手は「ここでは末尾だけを見ればいい」と分かります。
- **1 行の委譲**: 2 つの処理を 1 行で組み合わせています。後から処理を増やすときも、どこを直すかが明確です。
- **`\\/` の扱い**: Windows のような `\` を区切りに使う環境も考えて、2 種類の区切りを両方取り除きます。

## まとめ

- 逆変換は、付ける関数と外す関数を揃えて設計すると、往復しても元に戻る。
- 接頭辞の除去と末尾の整理を、別のメソッドに分けると読みやすい。
- `rtrim` で末尾の区切りを消すと、フォルダ名として自然な形になる。
