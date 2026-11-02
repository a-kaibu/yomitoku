---
title: "`-abc` のような短いオプションの並びを、1 文字ずつ読む"
description: "Symfony Console の ArgvInput::parseShortOptionSet は、-abc のように 1 文字ずつのオプションが並んだ指定を、1 文字ずつ読んで意味を決めます。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Console/Input/ArgvInput.php
lines: [132, 150]
function: ArgvInput::parseShortOptionSet
difficulty: 2
format: 2
tags: [CLI, 文字列処理]
---

## ひとことで

コマンドを打つとき、`-abc` と 1 文字ずつのオプションをまとめて書けることがあります。この関数は、その並びを左から 1 文字ずつ読み、どのオプションが指定されたかを決めます。

## コード

```php:line-numbers=132
    private function parseShortOptionSet(string $name): void
    {
        $len = \strlen($name);
        for ($i = 0; $i < $len; ++$i) {
            if (!$this->definition->hasShortcut($name[$i])) {
                $encoding = mb_detect_encoding($name, null, true);
                throw new RuntimeException(\sprintf('The "-%s" option does not exist.', false === $encoding ? $name[$i] : mb_substr($name, $i, 1, $encoding)));
            }

            $option = $this->definition->getOptionForShortcut($name[$i]);
            if ($option->acceptValue()) {
                $this->addLongOption($option->getName(), $i === $len - 1 ? null : substr($name, $i + 1));

                break;
            }

            $this->addLongOption($option->getName(), null);
        }
    }
```

## 前提知識

- **CLI（コマンドライン）**: 黒い画面にコマンドを打って、プログラムを動かす方法のことです。`-v` のような短いオプションや `--verbose` のような長いオプションを受け取ります。
- **文字列の添字**: `$name[$i]` と書くと、文字列の `$i` 番目の 1 文字を取り出せます。
- **`strlen` と `substr`**: 文字列の長さを数え、一部分を切り出す関数です。
- **例外（`throw`）**: 想定外のことが起きたときに、エラーとして処理を中断する仕組みです。

## 何をしているか

### 1. 文字を左から 1 つずつ見る

```php:line-numbers=134
        $len = \strlen($name);
        for ($i = 0; $i < $len; ++$i) {
```

`strlen` で長さを数え、`for` で先頭から 1 文字ずつ取り出します。

### 2. 存在しないオプションならエラーにする

```php:line-numbers=136
            if (!$this->definition->hasShortcut($name[$i])) {
                $encoding = mb_detect_encoding($name, null, true);
                throw new RuntimeException(\sprintf('The "-%s" option does not exist.', false === $encoding ? $name[$i] : mb_substr($name, $i, 1, $encoding)));
            }
```

その文字に対応するオプションがなければ、例外を投げて止まります。

### 3. 値を受け取るオプションなら、残りを値にして止める

```php:line-numbers=141
            $option = $this->definition->getOptionForShortcut($name[$i]);
            if ($option->acceptValue()) {
                $this->addLongOption($option->getName(), $i === $len - 1 ? null : substr($name, $i + 1));

                break;
```

値を受け取るオプションなら、後ろの文字列を値として登録し、`break` でループを抜けます。

### 4. 値のないオプションなら、記録して次へ進む

```php:line-numbers=148
            $this->addLongOption($option->getName(), null);
```

値を受け取らないオプションは `null` を値として登録し、次の文字へ進みます。

## ここがすごい

### 最後の文字かどうかで、値を決める

```php:line-numbers=143
                $this->addLongOption($option->getName(), $i === $len - 1 ? null : substr($name, $i + 1));
```

`$i === $len - 1` は、今見ている文字が最後かどうかを調べています。最後なら後ろに値がないので `null`、途中なら `substr` で残りの文字列を取り出します。

### 分からない文字は、文字コードを調べて伝える

```php:line-numbers=137
                $encoding = mb_detect_encoding($name, null, true);
                throw new RuntimeException(\sprintf('The "-%s" option does not exist.', false === $encoding ? $name[$i] : mb_substr($name, $i, 1, $encoding)));
```

存在しないオプションの場合、`mb_detect_encoding` で文字コードを調べ、日本語などの文字でも正しい文字をエラーメッセージに表示しています。

## まとめ

この関数は、短いオプションの並びを 1 文字ずつ読む関数です。値を受け取るオプションの後ろは、残りがそのまま値になるという決まりで、`-abc` のような書き方を扱えるようにしています。
