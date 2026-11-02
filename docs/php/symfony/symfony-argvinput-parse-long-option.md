---
title: "`--name=value` の長いオプションを分けて読む"
description: "Symfony Console の ArgvInput::parseLongOption は、--name=value の形で書かれた長いオプションを、名前と値に分けて登録します。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Console/Input/ArgvInput.php
lines: [155, 167]
function: ArgvInput::parseLongOption
difficulty: 1
format: 2
tags: [CLI, 文字列処理]
---

## ひとことで

`--format=json` のように、名前と値を `=` でつないだ長いオプションを読む関数です。`=` の前を名前、後ろを値として登録します。

## コード

```php:line-numbers=155
    private function parseLongOption(string $token): void
    {
        $name = substr($token, 2);

        if (false !== $pos = strpos($name, '=')) {
            if ('' === $value = substr($name, $pos + 1)) {
                array_unshift($this->parsed, $value);
            }
            $this->addLongOption(substr($name, 0, $pos), $value);
        } else {
            $this->addLongOption($name, null);
        }
    }
```

## 前提知識

- **長いオプション**: `--verbose` のように、2 本のハイフンで始まる名前のオプションです。
- **`strpos`**: 文字列の中に、ある文字が何番目にあるかを返す関数です。見つからなければ `false` を返します。
- **`substr`**: 文字列の一部を切り出す関数です。
- **`array_unshift`**: 配列の先頭に、値を追加する関数です。

## 何をしているか

### 1. 先頭の `--` を取り除く

```php:line-numbers=157
        $name = substr($token, 2);
```

`substr($token, 2)` で、先頭の 2 文字（`--`）を取り除きます。

### 2. `=` の位置を探す

```php:line-numbers=159
        if (false !== $pos = strpos($name, '=')) {
```

`strpos` で `=` の場所を探します。見つからなければ `false` になります。

### 3. `=` があれば、名前と値に分けて登録する

```php:line-numbers=163
            $this->addLongOption(substr($name, 0, $pos), $value);
```

`=` より前を名前、後ろを値として登録します。

### 4. `=` がなければ、値なしで登録する

```php:line-numbers=165
            $this->addLongOption($name, null);
```

名前だけを、値 `null` として登録します。

値が空の文字列のとき（`--name=` と書いたとき）は、次の部分で空の値を入力の先頭に戻しています。

```php:line-numbers=160
            if ('' === $value = substr($name, $pos + 1)) {
                array_unshift($this->parsed, $value);
            }
```

## ここがすごい

### `false !==` で、見つかったかどうかを確かめる

```php:line-numbers=159
        if (false !== $pos = strpos($name, '=')) {
```

`strpos` は見つからないと `false` を返します。0 番目で見つかった場合も「見つかった」と正しく判定するため、`!== false` と書いています。

### 登録の仕事を 1 つの関数に任せている

```php:line-numbers=163
            $this->addLongOption(substr($name, 0, $pos), $value);
        } else {
            $this->addLongOption($name, null);
```

どちらの分岐でも `addLongOption` を呼んでいます。値の有無を変えるだけで、登録の仕方はまとめてしまうため、読み手が迷いにくい構造です。

## まとめ

この関数は、`--name=value` と `--name` の 2 つの形を、同じ登録の仕組みへまとめて渡しています。`strpos` の結果を `false` と厳密に比べることで、確実に分けられるようにしています。
