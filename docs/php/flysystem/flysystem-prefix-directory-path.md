---
title: フォルダのパスは、末尾に区切りを1つだけ付ける
description: Flysystem の prefixDirectoryPath は、フォルダ名に保存先の接頭辞を付け、末尾に区切りの / を 1 つだけ揃えます。空のパスや、すでに末尾に区切りがある場合を正しく扱います。
language: php
project: Flysystem
repo: https://github.com/thephpleague/flysystem
license: MIT
copyright: Copyright (c) 2013-2026 Frank de Jonge
commit: "1e748897e0a8e897b5a8bc8942e05f4f57fa248c"
file: src/PathPrefixer.php
lines: [40, 49]
function: PathPrefixer::prefixDirectoryPath
difficulty: 2
format: 2
tags: [文字列処理, ファイル, 防御的プログラミング]
---
## ひとことで

`prefixDirectoryPath` は、フォルダを表すパスに保存先の接頭辞を付け、末尾に区切りの `/` を 1 つだけ付けます。ファイルの場合の `prefixPath` と違い、フォルダ名は「末尾が `/` で終わる」形にそろえる必要があるので、別の関数として用意されています。

## コード

```php:line-numbers=40
    public function prefixDirectoryPath(string $path): string
    {
        $prefixedPath = $this->prefixPath(rtrim($path, '\\/'));

        if ($prefixedPath === '' || substr($prefixedPath, -1) === $this->separator) {
            return $prefixedPath;
        }

        return $prefixedPath . $this->separator;
    }
```

## 前提知識

- **`rtrim`**: 文字列の右端から、指定した文字を取り除く関数です。`rtrim('photos/', '/')` は `photos` を返します。
- **`substr($s, -1)`**: 文字列の末尾 1 文字を取り出す書き方です。負の数は、右から数えた位置を表します。
- **`===` と空文字**: `''` は空の文字列です。`$prefixedPath === ''` は、中身が何も無いかを調べます。
- **`$this->separator`**: パスの区切り文字です。通常は `/` ですが、コンストラクタで変えられます。
- **`$this->prefixPath`**: 前の記事で扱った、接頭辞を付けるメソッドです。この関数はそれを呼んでから、末尾の処理をします。

## 何をしているか

### 1. 末尾の区切りを外してから接頭辞を付ける

```php:line-numbers=42
        $prefixedPath = $this->prefixPath(rtrim($path, '\\/'));
```

まず `rtrim` で、フォルダ名の末尾にある `\` と `/` を取り除きます。`photos/` と `photos` を、同じ `photos` として扱うためです。取り除いたあと、`prefixPath` で接頭辞を付けます。

### 2. すでに区切りで終わっていれば、そのまま返す

```php:line-numbers=44
        if ($prefixedPath === '' || substr($prefixedPath, -1) === $this->separator) {
            return $prefixedPath;
        }
```

2 つの条件のどちらかなら、何も付けずに返します。1 つめは、接頭辞もフォルダ名も空で、ルートを表す場合です。ルートに区切りを付けると、意味が変わってしまいます。2 つめは、すでに末尾が区切りで終わっている場合です。

### 3. 区切りを 1 つ付けて返す

```php:line-numbers=48
        return $prefixedPath . $this->separator;
```

上の条件に当てはまらなければ、末尾に区切りを 1 つ付けます。`photos` は `uploads/photos/` になります。

## ここがすごい

- **同じ入力を同じ結果にする**: `photos`、`photos/`、`photos//` のどれを渡しても、末尾の区切りは 1 つだけになります。フォルダの指定で迷わずに済みます。
- **空のパスを特別扱いする**: 接頭辞もフォルダ名も無いとき、区切りを付けないことで、ルートの意味を守っています。
- **順番が効いている**: 先に `rtrim` で外し、後で `prefixPath` を呼び、最後に区切りを付けるという順番です。どこか 1 つ入れ替えると、二重の区切りや欠けが生じます。
- **既存のメソッドを再利用**: 接頭辞の処理は `prefixPath` に任せ、この関数は末尾の決まりだけを扱います。役割が分かれているので、読みやすくなっています。

## まとめ

- フォルダのパスは、末尾の区切りを外してから接頭辞を付け、最後に区切りを 1 つだけ足す。
- 空のパスは特別扱いして、ルートの意味を変えない。
- 処理の順番が結果を決めるので、各段階の役割を分けて読むと理解しやすい。
