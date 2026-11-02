---
title: "「-vfoo」を、フラグの並びか値つきの指定かで読み分ける"
description: "Symfony Console の ArgvInput::parseShortOption は、コマンドの短いオプション -vfoo を読みます。最初の文字が値を受け取るオプションなら、後ろの部分を値として扱います。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Console/Input/ArgvInput.php
lines: [111, 125]
function: ArgvInput::parseShortOption
difficulty: 2
format: 2
tags: [CLI, パース, 文字列処理]
---

## ひとことで

`parseShortOption` は、コマンドラインの **短いオプション**（`-v` や `-n5`）を読み取る関数です。`-vvv` のように複数のフラグを並べた書き方と、`-n5` のように値をくっつけた書き方の両方を見分けます。

## コード

::: code-group

```php:line-numbers=111 [日本語訳]
    private function parseShortOption(string $token): void
    {
        $name = substr($token, 1);

        if (\strlen($name) > 1) {
            if ($this->definition->hasShortcut($name[0]) && $this->definition->getOptionForShortcut($name[0])->acceptValue()) {
                // 値を持つオプション（間に空白がない形）
                $this->addShortOption($name[0], substr($name, 1));
            } else {
                $this->parseShortOptionSet($name);
            }
        } else {
            $this->addShortOption($name, null);
        }
    }
```

```php:line-numbers=111 [原文]
    private function parseShortOption(string $token): void
    {
        $name = substr($token, 1);

        if (\strlen($name) > 1) {
            if ($this->definition->hasShortcut($name[0]) && $this->definition->getOptionForShortcut($name[0])->acceptValue()) {
                // an option with a value (with no space)
                $this->addShortOption($name[0], substr($name, 1));
            } else {
                $this->parseShortOptionSet($name);
            }
        } else {
            $this->addShortOption($name, null);
        }
    }
```

:::

## 前提知識

- **コマンドライン引数**: `php artisan migrate --force` のように、プログラムに渡す文字列です。
- **短いオプション**: `-v` のように、ハイフン 1 つと 1 文字で書くオプションです。
- **値を受け取るオプション**: `-n 5` や `-n5` のように、後ろに値を続けて書くオプションです。
- **`substr($token, 1)`**: 先頭の `-` を取り除いた残りを取り出します。
- **`strlen`**: 文字列の長さを数える関数です。

## 何をしているか

### 1. ハイフンを取り除いた名前を作る

```php:line-numbers=113
        $name = substr($token, 1);
```

`-n5` という文字列から、先頭の `-` を取った `n5` を `$name` にします。

### 2. 2 文字以上なら、値が続いているかを見る

```php:line-numbers=115
        if (\strlen($name) > 1) {
            if ($this->definition->hasShortcut($name[0]) && $this->definition->getOptionForShortcut($name[0])->acceptValue()) {
```

`$name` が 2 文字以上なら、最初の文字が何らかの指定なのか、値を受け取るものかを確かめます。`hasShortcut` で、その文字が登録されたオプションかを調べ、`acceptValue` で値を受け取るかを確かめます。

### 3. 値を受け取るなら、残りを値にする

::: code-group

```php:line-numbers=117 [日本語訳]
                // 値を持つオプション（間に空白がない形）
                $this->addShortOption($name[0], substr($name, 1));
```

```php:line-numbers=117 [原文]
                // an option with a value (with no space)
                $this->addShortOption($name[0], substr($name, 1));
```

:::

値を受け取るオプションなら、最初の 1 文字を名前として、残りの部分（`substr($name, 1)`）を値として登録します。`-n5` なら、オプション `n` の値は `5` です。

### 4. それ以外は、フラグの並びとして読む

```php:line-numbers=119
            } else {
                $this->parseShortOptionSet($name);
            }
        } else {
            $this->addShortOption($name, null);
        }
```

値を受け取らないオプションなら、`-vvv` のように 1 文字ずつフラグとして読みます。1 文字だけなら、そのまま値なしのオプションとして登録します。

## ここがすごい

### 同じ「-」の書き方で、2 つの意味を両立させる

`-abc` が「フラグ a、b、c」なのか「オプション a に値 bc」なのかは、オプションの定義で決まります。この関数は、定義を見てから読み方を決めるので、利用者は同じ書き方で両方を使えます。

### 読み方を決めるのは、定義の情報

プログラムの中で、どのオプションが値を取るかは、あらかじめ定義されています。コマンドを読む側が、その定義を照らし合わせることで、曖昧な入力も正しく分けられます。入力を先に決め打ちしないのが、柔軟さの鍵です。

### 分ける処理を、小さな関数に分ける

値つきの処理とフラグの処理を、別の関数（`parseShortOptionSet`）に分けています。読み手は、この関数の中で「どちらの読み方になるか」だけを見れば済みます。

## まとめ

- 短いオプションは、定義を見てから読み方を決めると曖昧さが消える。
- 「-n5」のように値をくっつけた書き方は、最初の文字で定義を調べると分けられる。
- フラグの並びは、1 文字ずつ読むと同じ処理で扱える。
- 読み方の分岐は、小さな関数に分けると流れを追いやすい。
