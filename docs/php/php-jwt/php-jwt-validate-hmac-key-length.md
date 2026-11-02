---
title: HMAC の鍵が、アルゴリズム名の長さより短ければ拒否する
description: php-jwt の validateHmacKeyLength は、HS256 などの署名方式に対して、鍵のビット数が十分かを確かめます。アルゴリズム名に含まれる数字を、必要な鍵の長さとして使うのが特徴です。
language: php
project: php-jwt
repo: https://github.com/firebase/php-jwt
license: BSD-3-Clause
copyright: Copyright (c) 2011, Neuman Vong
commit: "0501f5729b9e2448516674aff07c7d1727869b8e"
file: src/JWT.php
lines: [698, 705]
function: JWT::validateHmacKeyLength
difficulty: 2
format: 2
tags: [セキュリティ, 防御的プログラミング, 暗号]
---
## ひとことで

`validateHmacKeyLength` は、HMAC という方式でトークンに署名するとき、使う鍵が短すぎないかを確かめる関数です。ハッシュの名前 `SHA256` に含まれる数字（256）を、必要なビット数として使い、鍵がそれに満たなければ例外を投げます。

## コード

```php:line-numbers=698
    private static function validateHmacKeyLength(string $key, string $algorithm): void
    {
        $keyLength = \strlen($key) * 8;
        $minKeyLength = (int) \str_replace('SHA', '', $algorithm);
        if ($keyLength < $minKeyLength) {
            throw new DomainException('Provided key is too short');
        }
    }
```

## 前提知識

- **HMAC**: 秘密の鍵を使って、データの改ざんを見つけるための署名方式です。JWT の `HS256` や `HS512` は、この方式を使います。
- **ビットとバイト**: 1 バイトは 8 ビットです。鍵の長さをビットで比べるには、バイト数に 8 を掛けます。
- **`HS256`**: HMAC と SHA-256 を組み合わせた JWT の署名方式の名前です。この関数には、内部の表で対応する `SHA256` という名前が渡されます。末尾の `256` は、ハッシュの出力が 256 ビットであることを表します。
- **`str_replace`**: 文字列の一部を置き換える PHP の関数です。ここでは `SHA` の文字を空にして、数字だけを残します。
- **`(int)`**: 文字列を整数に変換するキャストです。
- **`DomainException`**: 値の範囲などが不正なときに使われる例外のクラスです。

## 何をしているか

### 1. 鍵の長さをビットで求める

```php:line-numbers=700
        $keyLength = \strlen($key) * 8;
```

`strlen($key)` で鍵のバイト数を求め、8 を掛けてビット数にします。たとえば 32 バイトの鍵は、256 ビットです。

### 2. アルゴリズム名から必要な長さを取り出す

```php:line-numbers=701
        $minKeyLength = (int) \str_replace('SHA', '', $algorithm);
```

`SHA256` から `SHA` を取り除くと、`256` だけが残ります。`(int)` で整数にすると、256 が必要な最小ビット数になります。方式の表が `'HS256' => ['hash_hmac', 'SHA256']` のように作られているので、この名前から長さを読めるのです。

### 3. 足りなければ例外を投げる

```php:line-numbers=702
        if ($keyLength < $minKeyLength) {
            throw new DomainException('Provided key is too short');
        }
```

鍵のビット数が必要な長さより短ければ、例外を投げます。署名の処理は、ここで止まります。短い鍵での署名は、総当たりで破られやすくなるからです。

## ここがすごい

- **規格の数字をそのまま使う**: 方式名に入った数字を、必要な鍵の長さとして読みます。別の表を用意しなくても、規則が名前に現れています。
- **早く拒否する**: 署名の前に検査するので、弱い鍵で署名されたトークンが発行されることを防ぎます。
- **単位をそろえてから比べる**: バイトをビットに変えてから比べるので、数字の意味が一致しています。
- **例外で止める**: 警告だけで続行せず、例外にして確実に止めます。セキュリティの判断を、呼び出し側の見落としに任せていません。

## まとめ

- HMAC の鍵は、方式が要求するビット数を満たしているかを、署名の前に確かめる。
- 比べる単位（バイトかビットか）を揃えてから、比較する。
- 方式名などの規格の情報は、検査の規則として直接使える。
- 弱い入力は、警告ではなく例外で止めると安全。
