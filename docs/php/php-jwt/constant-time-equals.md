---
title: 途中で止まらない文字列比較で、答えの手がかりを隠す
description: php-jwt の constantTimeEquals は、2 つの文字列が等しいかを、どこで違うかに関係なく同じ時間で判定します。署名の比較に使い、比較時間から秘密の値を推測されるのを防ぎます。
language: php
project: php-jwt
repo: https://github.com/firebase/php-jwt
license: BSD-3-Clause
copyright: Copyright (c) 2011, Neuman Vong
commit: "0501f5729b9e2448516674aff07c7d1727869b8e"
file: src/JWT.php
lines: [510, 524]
function: JWT::constantTimeEquals
difficulty: 3
format: 2
tags: [セキュリティ, 防御的プログラミング, ハック]
---
## ひとことで

`constantTimeEquals` は、2 つの文字列が同じかどうかを判定します。途中で違いが見つかっても打ち切らず、すべての文字を比べてから結果を返します。JWT の署名を検証するときに使われ、比較にかかる時間から秘密の値が漏れるのを防ぎます。

## コード

```php:line-numbers=510
    public static function constantTimeEquals(string $left, string $right): bool
    {
        if (\function_exists('hash_equals')) {
            return \hash_equals($left, $right);
        }
        $len = \min(self::safeStrlen($left), self::safeStrlen($right));

        $status = 0;
        for ($i = 0; $i < $len; $i++) {
            $status |= (\ord($left[$i]) ^ \ord($right[$i]));
        }
        $status |= (self::safeStrlen($left) ^ self::safeStrlen($right));

        return ($status === 0);
    }
```

## 前提知識

- **`==` と `===` の違い**: `===` は型も値も比べます。この関数では、最後に `$status === 0` で結果を判定しています。
- **`\function_exists`**: 関数が使えるかを確かめる PHP の関数です。`hash_equals` は PHP 5.6 以降の組み込み関数で、環境によっては無いこともあります。
- **`^`（XOR）**: 2 つのビットを比べ、違うときだけ 1 になる演算です。`5 ^ 5` は `0`、`5 ^ 3` は `6` になります。
- **`|=`**: 左辺と右辺の `|`（OR）を取り、左辺に入れ直す代入です。一度でも 1 が立つと、そのあとは 0 に戻りません。
- **`\ord`**: 1 文字をバイトの値（0〜255）に変換する関数です。

## 何をしているか

### 1. 組み込みの関数があれば使う

```php:line-numbers=512
        if (\function_exists('hash_equals')) {
            return \hash_equals($left, $right);
        }
```

PHP に `hash_equals` があれば、その結果をそのまま返します。組み込みの関数は C 言語で書かれており、同じ目的をもっと確実に達成します。無いときだけ、次の自前の処理が動きます。

### 2. 比べる長さを決める

```php:line-numbers=515
        $len = \min(self::safeStrlen($left), self::safeStrlen($right));
```

2 つの文字列の短いほうの長さを使います。長いほうの後ろは、後の一行で別に扱います。

### 3. すべての文字の違いを 1 つの変数にまとめる

```php:line-numbers=517
        $status = 0;
        for ($i = 0; $i < $len; $i++) {
            $status |= (\ord($left[$i]) ^ \ord($right[$i]));
        }
```

`$status` は最初 0 です。同じ位置の文字を XOR すると、同じなら 0、違うならゼロでない値になります。その値を `|=` で `$status` に足していきます。

たとえば `abc` と `abd` を比べると、最初の 2 文字は XOR が 0 で、3 文字目は `ord('c') ^ ord('d')` の `3` になります。`$status` は `3` になります。ここで比較を止めることはありません。

### 4. 長さの違いも同じように扱う

```php:line-numbers=521
        $status |= (self::safeStrlen($left) ^ self::safeStrlen($right));
```

長さが違えば、そのぶんも `$status` に入ります。`abc` と `abcd` は、先頭 3 文字が同じでも `$status` がゼロにならず、結果は `false` です。

### 5. 最後に 0 かどうかを見る

```php:line-numbers=523
        return ($status === 0);
```

1 か所でも違いがあれば `$status` はゼロではないので、`false` を返します。違いが見つかった場所は、戻り値からは分かりません。

## ここがすごい

- **違いの位置を隠している**: 普通の `==` や `strcmp` は、最初に違う文字が見つかった時点で止まることがあります。攻撃者は、応答時間の差から「最初の何文字が合っているか」を推測できてしまいます。この関数は、どの位置で違っても同じ回数だけループします。
- **分岐がほとんどない**: 違いがあるかどうかで `if` を使わず、ビットの OR だけで結果をまとめています。処理を早く抜けるための分岐が無いので、時間差が出にくくなります。
- **長さの違いも含めている**: 長さが違う場合も、`$status` に違いを残します。長さの違いを見落とすと、一方が他方の接頭辞のときに誤って `true` になってしまいます。
- **組み込みを優先する**: `hash_equals` が使えるならそれを使い、無い環境でも同じ性質を持つ処理に戻ります。

## まとめ

- 文字列の比較は、途中で止まると時間差から情報が漏れることがある。
- XOR と OR を使えば、違いの場所を返さずに「違いがあったか」だけを 1 つの値に集められる。
- 長さの違いも同じ変数に入れ、接頭辞の一致を取りこぼさないようにする。
- セキュリティに関わる比較では、組み込みの専用関数があればそれを優先する。
