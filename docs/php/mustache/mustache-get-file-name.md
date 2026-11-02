---
title: テンプレートの名前から、読み込むファイルの場所を組み立てる
description: mustache.php の getFileName は、テンプレートの名前に基準フォルダと拡張子を足して、ファイルの場所を作ります。名前の検査と、基準フォルダの中にあるかの確認も、この順番で行われます。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Loader/FilesystemLoader.php
lines: [141, 155]
function: getFileName
difficulty: 2
format: 2
tags: [ファイル, 防御的プログラミング, 文字列処理]
---
## ひとことで

`getFileName` は、テンプレートの名前（たとえば `profile`）から、実際に読み込むファイルのパス（たとえば `/views/profile.mustache`）を作る関数です。名前を検査し、基準フォルダにつなぎ、必要なら拡張子を補います。最後に、基準フォルダの外へ出ていないかも確かめます。

## コード

```php:line-numbers=141
    protected function getFileName($name)
    {
        $this->validateName($name);

        $fileName = $this->baseDir . '/' . $name;
        if ($this->extension !== '' && substr($fileName, 0 - strlen($this->extension)) !== $this->extension) {
            $fileName .= $this->extension;
        }

        if (!$this->allowUnsafeTemplateNames && $this->checkPath) {
            return $this->ensureContained($fileName, $name);
        }

        return $fileName;
    }
```

## 前提知識

- **テンプレートのローダー**: テンプレートの名前から、中身を取り出す部品です。ファイルシステムのローダーは、フォルダに置かれたファイルを読みます。
- **拡張子**: `.mustache` のように、ファイル名の最後に付く印です。名前に拡張子を書かなくても、読めるようにできます。
- **`substr` と `strlen`**: 文字列の末尾を取り出す関数と、文字列の長さを数える関数です。`substr($fileName, 0 - strlen(...))` で、末尾が拡張子かどうかを調べられます。
- **`validateName`**: 名前が使ってよい形かを確かめるメソッドです。ここで問題があれば、先に例外を投げます。
- **`ensureContained`**: 組み立てたパスが基準フォルダの中にあるかを確かめる、前に紹介したメソッドです。

## 何をしているか

### 1. 名前を検査してから、パスを組み立てる

```php:line-numbers=143
        $this->validateName($name);

        $fileName = $this->baseDir . '/' . $name;
```

まず `validateName` で、名前が使える形かを確かめます。そのあと、基準フォルダ `$this->baseDir` と `/` と名前をつないで、仮のパスを作ります。

### 2. 拡張子が無ければ付ける

```php:line-numbers=146
        if ($this->extension !== '' && substr($fileName, 0 - strlen($this->extension)) !== $this->extension) {
            $fileName .= $this->extension;
        }
```

拡張子が設定されていて、パスの末尾がその拡張子でなければ、拡張子を付けます。すでに `.mustache` で終わっていれば、二重には付きません。

### 3. 安全確認が必要なら、確かめる

```php:line-numbers=150
        if (!$this->allowUnsafeTemplateNames && $this->checkPath) {
            return $this->ensureContained($fileName, $name);
        }
```

`allowUnsafeTemplateNames` が `false` で、`checkPath` が `true` なら、`ensureContained` で基準フォルダの中かを確かめます。その結果のパスを返します。

### 4. そうでなければ、そのまま返す

```php:line-numbers=154
        return $fileName;
```

安全確認を省く設定のときは、組み立てたパスをそのまま返します。

## ここがすごい

- 名前の検査、パスの組み立て、拡張子の補完、安全確認を、この順番で一本の流れにしています。どの段階で何が起きるかが、上から読めます。
- 拡張子の判定を、末尾の文字だけを比べることで行っています。名前に拡張子が含まれていれば、重複して付けない工夫です。
- 安全確認を、設定のスイッチで止められるようにしています。信頼できるテンプレートだけを扱う場面では、確認を省いて速く動かせます。
- `validateName` で、NUL 文字を含むなどの不正な名前を、組み立ての前に弾いています。不正な名前をパスに混ぜないための、最初の関門になっています。

## まとめ

`getFileName` は、テンプレートの名前を、読み込めるファイルのパスに変換する関数です。名前を検査し、拡張子を補い、必要に応じて基準フォルダの中かを確かめます。ファイルを読む前の準備を、段階ごとに分けて書いている点が、読みやすさの理由になっています。
