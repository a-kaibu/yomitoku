---
title: 末尾の「\」を、見えない NUL 文字に置き換えて長さを保つ
description: Symfony Console の OutputFormatter::escapeTrailingBackslash は、文字列の末尾にある \ を取り除き、同じ長さの NUL 文字に変えます。後ろの書式処理と組み合わさって、意図しない効果が出ないようにする工夫です。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/Console/Formatter/OutputFormatter.php
lines: [57, 67]
function: OutputFormatter::escapeTrailingBackslash
difficulty: 3
format: 2
tags: [防御的プログラミング, 文字列処理, CLI]
---
## ひとことで

`escapeTrailingBackslash` は、ターミナルに出す文字列の末尾が `\` で終わっているときに、その `\` を見えない NUL 文字（`\0`）に置き換える関数です。文字列の長さは変わりません。Console の書式タグを扱う処理が、末尾の `\` を前後の文字と組み合わせて解釈しないようにするために使われます。

## コード

```php:line-numbers=57
    public static function escapeTrailingBackslash(string $text): string
    {
        if (str_ends_with($text, '\\')) {
            $len = \strlen($text);
            $text = rtrim($text, '\\');
            $text = str_replace("\0", '', $text);
            $text .= str_repeat("\0", $len - \strlen($text));
        }

        return $text;
    }
```

## 前提知識

- **書式タグ**: Symfony Console では、`<info>...</info>` のような印で文字に色を付けられます。これを書式タグと呼びます。
- **エスケープ**: 記号の意味を打ち消して、普通の文字として扱わせることです。ここでは、末尾の `\` が後ろの処理と組み合わさって、意味を持つことを避けるために使われます。
- **NUL 文字（`\0`）**: 値が 0 の文字です。画面には表示されず、長さだけを持ちます。
- **`rtrim`**: 右端から、指定した文字を取り除く関数です。`rtrim('ab\\\\', '\\')` は `ab` を返します。
- **`str_repeat`**: 同じ文字を指定回数だけ繰り返して作る関数です。
- **`str_ends_with`**: 文字列が指定の文字で終わるかを調べる関数です。

## 何をしているか

### 1. 末尾が `\` かを確かめる

```php:line-numbers=59
        if (str_ends_with($text, '\\')) {
            $len = \strlen($text);
```

末尾が `\` でなければ、何もせず返します。`\` で終わるときだけ処理をします。元の長さを `$len` に覚えておくのは、後で同じ長さに戻すためです。

### 2. 末尾の `\` を取り除き、NUL を取り除く

```php:line-numbers=61
            $text = rtrim($text, '\\');
            $text = str_replace("\0", '', $text);
```

末尾の `\` をすべて取り除きます。そのあと、文字列の中にもともとあった NUL 文字も取り除きます。こうしないと、後で数える NUL の数が合わなくなるからです。

### 3. 失った長さを NUL で埋める

```php:line-numbers=63
            $text .= str_repeat("\0", $len - \strlen($text));
```

取り除いた `\` の数だけ、NUL 文字を末尾に付けます。結果として、文字列の長さは元と同じになります。

たとえば `a\` は、長さ 2 です。`\` を取り除くと `a` になり、長さ 1 の不足を補うために NUL を 1 つ付けると、`a` と NUL の 2 文字になります。見た目は `a` のままです。

## ここがすごい

- **長さを保つ**: 文字列の長さが変わると、表示の幅を計算する処理がずれます。見えない NUL で埋めることで、長さの計算を崩さずに済ませています。
- **見た目を変えない**: NUL は画面に何も表示しないので、利用者は `\` が消えたことに気付きません。
- **先に NUL を取り除く**: もともと文字列にあった NUL を消してから数え直すので、数の対応が正しくなります。
- **条件を満たすときだけ処理**: 末尾が `\` でなければ、何もせずに返します。大半の文字列は、余計な処理を受けません。

## まとめ

- 後ろの処理に影響する文字は、見えない文字で置き換えると、見た目と長さを両立できる。
- 元の長さを覚えておくと、同じ長さに戻すのが確実。
- 置き換えの前に、既存の見えない文字を取り除くと、数の対応が崩れない。
