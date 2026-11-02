---
title: コマンドの引数を、OS ごとのルールで安全に囲む
description: Symfony の Process::escapeArgument は、引数にスペースや記号が含まれても、シェルが正しく 1 つの値として読むように囲みます。Linux と Windows で書き方を分けているのが見どころです。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Process/Process.php
lines: [1758, 1775]
function: Process::escapeArgument
difficulty: 3
format: 2
tags: [セキュリティ, 文字列処理, 移植性]
---

## ひとことで

`escapeArgument` は、シェルに渡すコマンドの引数を **安全に囲んで** 返す関数です。引数に空白や `;` や `'` が入っていても、シェルがそれをコマンドの区切りと誤解せず、1 つの値として扱えるようにします。

## コード

```php:line-numbers=1758
    private function escapeArgument(?string $argument): string
    {
        if ('' === $argument || null === $argument) {
            return '""';
        }
        if ('\\' !== \DIRECTORY_SEPARATOR) {
            return "'".str_replace("'", "'\\''", $argument)."'";
        }
        if (str_contains($argument, "\0")) {
            $argument = str_replace("\0", '?', $argument);
        }
        if (!preg_match('/[()%!^"<>&|\s[\]=;*?\'$]/', $argument)) {
            return $argument;
        }
        $argument = preg_replace('/(\\\\+)$/', '$1$1', $argument);

        return '"'.str_replace(['"', '^', '%', '!', "\n"], ['""', '"^^"', '"^%"', '"^!"', '!LF!'], $argument).'"';
    }
```

## 前提知識

- **シェル**: `bash` や `cmd` のように、コマンドを文字列で受け取って実行するプログラムです。
- **引用符（クォート）**: 文字列を `'...'` や `"..."` で囲んで、中の空白や記号を普通の文字として扱わせる書き方です。
- **シェルインジェクション**: 引数の中の文字をシェルが解釈してしまい、想定外のコマンドが実行される事故です。
- **`DIRECTORY_SEPARATOR`**: OS のパス区切り文字です。Windows では `\`、それ以外では `/` になります。ここではこの値で OS を見分けています。
- **`preg_match`**: 正規表現で文字列に特定のパターンがあるかを調べる関数です。

## 何をしているか

### 1. 空の引数は、空の引用符にする

```php:line-numbers=1760
        if ('' === $argument || null === $argument) {
            return '""';
        }
```

空の引数（`''` や `null`）は、そのまま渡すと消えてしまいます。`""` と書くことで、シェルに「空の値が 1 つある」と伝えます。

### 2. Linux などでは、シングルクォートで囲む

```php:line-numbers=1763
        if ('\\' !== \DIRECTORY_SEPARATOR) {
            return "'".str_replace("'", "'\\''", $argument)."'";
        }
```

`'\\' !== DIRECTORY_SEPARATOR` のとき、つまり Windows 以外では、全体をシングルクォートで囲みます。シングルクォートの中では、`$` や `;` などの記号が特別な意味を持ちません。

中に `'` があるときは、`str_replace("'", "'\\''", ...)` で `'\''` に置き換えます。これは「いったん引用符を閉じ、エスケープした `'` を書き、また開く」という、シェルの決まった書き方です。

具体例として `it's` は、`'it'\''s'` になります。

### 3. Windows では、特別な文字だけを書き換える

```php:line-numbers=1766
        if (str_contains($argument, "\0")) {
            $argument = str_replace("\0", '?', $argument);
        }
        if (!preg_match('/[()%!^"<>&|\s[\]=;*?\'$]/', $argument)) {
            return $argument;
        }
        $argument = preg_replace('/(\\\\+)$/', '$1$1', $argument);

        return '"'.str_replace(['"', '^', '%', '!', "\n"], ['""', '"^^"', '"^%"', '"^!"', '!LF!'], $argument).'"';
```

Windows の `cmd` は、引用符の中でも `%` や `!` や `^` を特別に扱うことがあります。そのため、まず NUL 文字を `?` に置き換え、特別な文字（引用符・空白・記号など）がなければそのまま返します。含まれていれば、末尾の `\` を二重にし、`"` を `""` に、`^` `%` `!` を引用符の外で無効にする形に書き換え、全体を `"` で囲みます。

## ここがすごい

### 「安全にする」を、OS ごとに分けている

Linux のシェルと Windows のコマンドプロンプトは、文字の扱いが大きく違います。1 つのルールで両方を正しく囲むことはできないので、`DIRECTORY_SEPARATOR` で OS を見分けて、それぞれに合った方法を選んでいます。

### 特別な文字がないときは、何も囲まない

Windows の分岐では、`preg_match` で危ない文字があるかを先に確かめています。普通の単語なら、そのまま返します。余計な引用符を付けないことで、出力されるコマンドも読みやすくなります。

### 「囲む」は、完全な対策ではない

この関数は、引数を 1 つの値として扱わせるための対策です。コマンドそのものを外から組み立てる場合は、できるだけ引数を配列で渡す方法（`Process` の配列形式）を使うのが安全です。引用符の書き方だけに頼らないことが大切です。

## まとめ

- 引数を安全に渡すには、OS のシェルの引用ルールに合わせて囲む必要がある。
- Linux では、シングルクォートの中に `'` があるときの書き換えが決まっている。
- Windows では、引用符の中でも特別な記号（`%` `!` `^`）に注意が要る。
- 可能なら、引数は文字列ではなく配列で渡すと、囲む処理そのものを減らせる。
