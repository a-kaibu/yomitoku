---
title: 先頭のスラッシュを外してから、接頭辞をつける
description: Flysystem の prefixPath は、ファイルの相対パスに保存先の接頭辞を付けて、実際の場所を作ります。余計なスラッシュを取り除いてから付けるので、つなぎ目が二重にならない工夫です。
language: php
project: Flysystem
repo: https://github.com/thephpleague/flysystem
license: MIT
copyright: Copyright (c) 2013-2026 Frank de Jonge
commit: "1e748897e0a8e897b5a8bc8942e05f4f57fa248c"
file: src/PathPrefixer.php
lines: [24, 27]
function: PathPrefixer::prefixPath
difficulty: 1
format: 2
tags: [文字列処理, ファイル, API設計]
---
## ひとことで

`prefixPath` は、ストレージの中のファイルの相対パスに、保存先の接頭辞（プレフィックス）を付けて、実際の場所を表すパスを作ります。Flysystem は、ローカルのフォルダでも、クラウドの保存先でも同じように呼べるように、この変換を 1 か所にまとめています。

## コード

```php:line-numbers=24
    public function prefixPath(string $path): string
    {
        return $this->prefix . ltrim($path, '\\/');
    }
```

## 前提知識

- **接頭辞（プレフィックス）**: パスの前に付ける共通の部分です。`uploads/` のようなフォルダ名が、よく使われます。
- **相対パス**: 基準となる場所からの道筋です。`avatars/me.png` のように、先頭にスラッシュが付かない形を指します。
- **`ltrim`**: 文字列の左端から、指定した文字を取り除く PHP の関数です。`ltrim('//a', '/')` は `a` を返します。
- **`'\\/'`**: 取り除く文字の並びです。PHP の文字列では `\\` が 1 つの `\` を表すので、`\` と `/` の 2 文字を指定しています。
- **`$this->prefix`**: オブジェクトの中に保存された接頭辞です。コンストラクタで一度だけ設定されます。

## 何をしているか

### 1. 相対パスの左端を整える

```php:line-numbers=26
        return $this->prefix . ltrim($path, '\\/');
```

`ltrim($path, '\\/')` は、`$path` の先頭にある `\` と `/` をすべて取り除きます。`/avatars/me.png` でも `avatars/me.png` でも、同じ結果になります。

### 2. 接頭辞と連結する

同じ行の `$this->prefix . ...` が、接頭辞を前に付けます。接頭辞が `uploads/` なら、`avatars/me.png` は `uploads/avatars/me.png` になります。

## ここがすごい

- **つなぎ目の二重化を防ぐ**: 接頭辞の末尾に `/` があり、パスの先頭にも `/` があると、`uploads//avatars` のように二重になります。左端を取り除いてから連結すると、この問題が起きません。
- **入力の形を問わない**: 呼ぶ側が先頭のスラッシュを付けても付けなくても、同じ場所を指します。ユーザーが入力したパスを安全に扱えます。
- **1 か所で決まる**: 保存先の場所の決まりは、このクラスにだけあります。ローカルかクラウドかに関係なく、同じルールで動きます。
- **変換が 1 行で済む**: 関数の本体が 1 行なので、処理の意味が一目で分かります。

## まとめ

- 保存先の接頭辞とファイルパスは、つなぎ目の `/` を揃えてから連結する。
- `ltrim` で左端の区切り文字を取り除くと、入力の形に左右されなくなる。
- パスの変換を 1 か所にまとめると、ストレージの種類が変わっても同じ規則で動く。
