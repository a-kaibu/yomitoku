---
title: ログに含まれる秘密の値を、深さの上限つきで集める
description: Monolog の RedactingFormatter の collectSensitiveValue は、ログのデータの中から、隠すべき秘密の値を再帰的に集めます。配列の中の配列を深さの上限まで降りて、見つけた値を登録していきます。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Formatter/RedactingFormatter.php
lines: [249, 264]
function: collectSensitiveValue
difficulty: 3
format: 2
tags: [セキュリティ, 再帰, 防御的プログラミング]
---
## ひとことで

`collectSensitiveValue` は、ログのデータの中にあるパスワードやトークンなどの秘密の値を、ひとつずつ見つけて集める関数です。配列の中に配列があっても、深さの上限まで潜って調べます。集めた値は、あとでログの中から伏せ字に置き換えられます。

## コード

```php:line-numbers=249
    private function collectSensitiveValue(mixed $value, array &$secrets, int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            return;
        }

        if (\is_array($value)) {
            foreach ($value as $item) {
                $this->collectSensitiveValue($item, $secrets, $depth + 1);
            }

            return;
        }

        $this->addSecret($value, $secrets);
    }
```

## 前提知識

- **秘密の値（シークレット）**: パスワード、API キー、トークンなど、ログに残ってはいけない情報です。ログに誤って書かれると、漏えいにつながります。
- **再帰**: 関数の中で、自分自身を呼ぶ書き方です。配列の中にさらに配列があるような、入れ子の構造を順に調べられます。
- **深さの上限（MAX_DEPTH）**: 再帰が深くなりすぎないように決めた限界の値です。循環するデータや、極端に深いデータによって、処理が止まらないようにします。
- **参照渡し（`array &$secrets`）**: 配列を、コピーせずに元の変数のまま書き換える渡し方です。集めた値を、呼び出し元に残せます。
- **`addSecret`**: 値を秘密として登録するメソッドです。この関数は、配列の深さをたどることだけに専念し、登録の細かな処理は `addSecret` に任せています。

## 何をしているか

### 1. 深すぎたら、ここで打ち切る

```php:line-numbers=251
        if ($depth > self::MAX_DEPTH) {
            return;
        }
```

深さが上限を超えたら、何もせずに戻ります。深い入れ子の中を、際限なく調べないための安全弁です。

### 2. 配列なら、中の値をそれぞれ調べる

```php:line-numbers=255
        if (\is_array($value)) {
            foreach ($value as $item) {
                $this->collectSensitiveValue($item, $secrets, $depth + 1);
            }

            return;
        }
```

値が配列なら、要素の一つ一つについて、自分自身を呼びます。その時、深さを 1 つ増やします。配列の中にさらに配列があれば、その中まで同じように調べられます。配列を処理したら、ここで `return` して、後の登録へ進まないようにしています。

### 3. 配列でなければ、秘密として登録する

```php:line-numbers=263
        $this->addSecret($value, $secrets);
```

配列でない値は、`addSecret` に渡して登録します。登録された値は、集まった `$secrets` に加えられます。

## ここがすごい

- 配列かどうかで処理を分けているので、入れ子の深さが分からなくても、どこまでも同じ手順で調べられます。
- 深さの上限を持つことで、循環したデータや巨大なデータに対しても、処理が暴走しません。安全と性能の両方を守っています。
- 配列を処理したあとに `return` することで、配列そのものを秘密として登録してしまう誤りを防いでいます。分岐の形が、そのまま正しさにつながっています。
- 集める処理と、伏せ字に置き換える処理を分けています。集めることに専念した関数なので、読むのも直すのも容易です。

## まとめ

`collectSensitiveValue` は、ログのデータの中から秘密の値を、再帰的に集める関数です。深さの上限で安全を守り、配列の中まで潜って、見つけた値を登録します。ログに秘密を残さないという目的を、短い再帰で実現している、丁寧な防御の例です。
