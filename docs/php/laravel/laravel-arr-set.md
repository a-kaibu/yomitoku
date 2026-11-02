---
title: "「a.b.c」のキーで、入れ子の深い場所へ値を書き込む"
description: "Laravel の Arr::set は、ドットで区切ったキーを使って、入れ子の配列の深い場所に値を書き込みます。途中の配列がなければ作り、参照で奥へ進んでいくのが工夫です。"
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Arr.php
lines: [1028, 1056]
function: Arr::set
difficulty: 3
format: 2
tags: [データ構造, 再帰, イディオム]
---

## ひとことで

`Arr::set` は、`user.address.city` のようなドット記法のキーを使って、**入れ子の配列の深い場所に値を入れる** 関数です。途中の配列がなければ自動で作るので、利用者は深さを気にせず書き込めます。`Arr::get` の逆の操作にあたります。

## コード

::: code-group

```php:line-numbers=1028 [日本語訳]
    public static function set(&$array, $key, $value)
    {
        if (is_null($key)) {
            return $array = $value;
        }

        $keys = explode('.', $key);

        foreach ($keys as $i => $key) {
            if (count($keys) === 1) {
                break;
            }

            unset($keys[$i]);

            // このキーの段がなければ、空の配列を作る。
            // 次の値を入れるための箱なので、正しい深さに配列を作れる。
            // そのうえで、さらに奥へ掘り進む。
            if (! isset($array[$key]) || ! is_array($array[$key])) {
                $array[$key] = [];
            }

            $array = &$array[$key];
        }

        $array[array_shift($keys)] = $value;

        return $array;
    }
```

```php:line-numbers=1028 [原文]
    public static function set(&$array, $key, $value)
    {
        if (is_null($key)) {
            return $array = $value;
        }

        $keys = explode('.', $key);

        foreach ($keys as $i => $key) {
            if (count($keys) === 1) {
                break;
            }

            unset($keys[$i]);

            // If the key doesn't exist at this depth, we will just create an empty array
            // to hold the next value, allowing us to create the arrays to hold final
            // values at the correct depth. Then we'll keep digging into the array.
            if (! isset($array[$key]) || ! is_array($array[$key])) {
                $array[$key] = [];
            }

            $array = &$array[$key];
        }

        $array[array_shift($keys)] = $value;

        return $array;
    }
```

:::

## 前提知識

- **参照 `&`**: 変数を別の変数と同じ場所に結ぶ書き方です。`$array = &$array[$key];` は、「今の場所」をさらに奥の場所へ付け替えることを意味します。
- **`array_shift`**: 配列の先頭の要素を取り出して、配列から取り除く関数です。
- **`explode`**: 文字列を区切り文字で分けて、配列にする関数です。
- **`isset` と `is_array`**: 値があるか、配列かを調べる関数です。
- **`unset`**: 変数や配列の要素を取り消す命令です。

## 何をしているか

### 1. キーが `null` なら、配列全体を置き換える

```php:line-numbers=1030
        if (is_null($key)) {
            return $array = $value;
        }
```

キーの指定がなければ、配列そのものを `$value` にします。

### 2. ドットで分けて、1 段ずつ奥へ進む

```php:line-numbers=1034
        $keys = explode('.', $key);

        foreach ($keys as $i => $key) {
            if (count($keys) === 1) {
                break;
            }
```

`explode('.', $key)` でキーを分けます。残りのキーが 1 つになったら、そこで止まります。

::: code-group

```php:line-numbers=1041 [日本語訳]
            unset($keys[$i]);

            // このキーの段がなければ、空の配列を作る。
            // 次の値を入れるための箱なので、正しい深さに配列を作れる。
            // そのうえで、さらに奥へ掘り進む。
            if (! isset($array[$key]) || ! is_array($array[$key])) {
                $array[$key] = [];
            }

            $array = &$array[$key];
        }
```

```php:line-numbers=1041 [原文]
            unset($keys[$i]);

            // If the key doesn't exist at this depth, we will just create an empty array
            // to hold the next value, allowing us to create the arrays to hold final
            // values at the correct depth. Then we'll keep digging into the array.
            if (! isset($array[$key]) || ! is_array($array[$key])) {
                $array[$key] = [];
            }

            $array = &$array[$key];
        }
```

:::

先頭の段の名前を `unset` で取り除き、その段の配列がなければ `[]` を作ります。`$array = &$array[$key];` で、今の場所を一段奥へ移します。参照で結んでいるので、この `$array` への書き換えは元の配列に直接効きます。

### 3. 最後の段に値を入れる

```php:line-numbers=1053
        $array[array_shift($keys)] = $value;

        return $array;
```

残った最後のキーに `$value` を入れます。`array_shift` で取り出すと、残りのキーは配列の 0 番目に来るので、それを使います。

具体例として、空の配列に `a.b.c` として `1` を入れると、`['a' => ['b' => ['c' => 1]]]` ができあがります。

## ここがすごい

### 参照で「今いる場所」を持ち歩く

深い場所に書き込むには、途中のすべての段を通らなければなりません。この関数は、`$array` という変数自体を参照で付け替えていきます。ループが進むと、`$array` が今の段を指すので、最後に 1 回代入するだけで正しい場所に入ります。途中の値をいくつも覚える必要がありません。

### 途中の段を、作りながら進む

```php:line-numbers=1046
            if (! isset($array[$key]) || ! is_array($array[$key])) {
                $array[$key] = [];
```

`isset` で段がなければ、空の配列を作ってから進みます。深さが分かっていない入力でも、自動的に箱ができます。その代わり、途中に文字列などがあれば、上書きされてしまいます。便利さと引き換えの振る舞いです。

### コメントが、なぜ作るかを説明している

::: code-group

```php:line-numbers=1043 [日本語訳]
            // このキーの段がなければ、空の配列を作る。
            // 次の値を入れるための箱なので、正しい深さに配列を作れる。
            // そのうえで、さらに奥へ掘り進む。
```

```php:line-numbers=1043 [原文]
            // If the key doesn't exist at this depth, we will just create an empty array
            // to hold the next value, allowing us to create the arrays to hold final
            // values at the correct depth. Then we'll keep digging into the array.
```

:::

コメントには、空の配列を作る理由が書かれています。「次の値を入れる箱」「正しい深さ」「奥へ掘り進む」という説明が、そのままコードの意図になっています。

## まとめ

- ドット記法の書き込みは、途中の段を作りながら進むと深さに依存しない。
- 参照を付け替えて「今の場所」を持ち歩くと、途中の値を覚えずに済む。
- 途中に別の型の値があれば上書きされるので、入力の形に注意する。
- 関数の意図は、コメントで「なぜ作るか」を書くと後の人が理解しやすい。
