---
title: JSON オブジェクトの次のキーを読み取る
description: serde_json の MapAccess::next_key_seed。区切りのカンマや閉じ括弧を先に確かめ、キーが文字列で始まるかを検査してから、キーを読み取る。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/de.rs
lines: [1986, 2025]
function: next_key_seed
difficulty: 3
format: 2
tags: [パース, 入出力, エラー処理]
---

## ひとことで

`next_key_seed` は、serde_json が JSON のオブジェクト（`{ "a": 1, "b": 2 }`）を読むときに、**次のキーを 1 つ読み取る** 関数です。キーの前にあるカンマや閉じ括弧を確かめて、読むべきか、オブジェクトの終わりかを決めます。

読み取りの形式が正しくなければ、「カンマの後に閉じ括弧がある」「キーが文字列ではない」など、それぞれ別のエラーを返します。どの場所で何が間違っているかが、利用者に分かるようになっています。

## コード

```rust:line-numbers=1986
    fn next_key_seed<K>(&mut self, seed: K) -> Result<Option<K::Value>>
    where
        K: de::DeserializeSeed<'de>,
    {
        fn has_next_key<'de, 'a, R: Read<'de> + 'a>(map: &mut MapAccess<'a, R>) -> Result<bool> {
            let peek = match tri!(map.de.parse_whitespace()) {
                Some(b) => b,
                None => {
                    return Err(map.de.peek_error(ErrorCode::EofWhileParsingObject));
                }
            };

            if peek == b'}' {
                Ok(false)
            } else if map.first {
                map.first = false;
                if peek == b'"' {
                    Ok(true)
                } else {
                    Err(map.de.peek_error(ErrorCode::KeyMustBeAString))
                }
            } else if peek == b',' {
                map.de.eat_char();
                match tri!(map.de.parse_whitespace()) {
                    Some(b'"') => Ok(true),
                    Some(b'}') => Err(map.de.peek_error(ErrorCode::TrailingComma)),
                    Some(_) => Err(map.de.peek_error(ErrorCode::KeyMustBeAString)),
                    None => Err(map.de.peek_error(ErrorCode::EofWhileParsingValue)),
                }
            } else {
                Err(map.de.peek_error(ErrorCode::ExpectedObjectCommaOrEnd))
            }
        }

        if tri!(has_next_key(self)) {
            Ok(Some(tri!(seed.deserialize(MapKey { de: &mut *self.de }))))
        } else {
            Ok(None)
        }
    }
```

## 前提知識

- **JSON のオブジェクト**: `{` と `}` で囲まれ、`"キー": 値` の組をカンマで区切って並べたものです。キーは必ず文字列です。
- **`MapAccess`**: serde で、マップの要素を 1 つずつ読むための型です。`next_key_seed` は、その中でキーを読む関数です。
- **`DeserializeSeed`**: 読み取った値をどんな型にするかを、値とは別に指定する仕組みです。ここでは、キーを読む専用の `MapKey` に渡します。
- **`peek`**: 次の文字を読むが、読み進めない操作です。どの読み方をするかを決めるために使います。
- **`parse_whitespace`**: 空白を飛ばして、次の文字を返す関数です。改行や空白があっても、JSON として正しく読めます。

## 何をしているか

### 1. 次の文字を確かめる

```rust:line-numbers=1990
        fn has_next_key<'de, 'a, R: Read<'de> + 'a>(map: &mut MapAccess<'a, R>) -> Result<bool> {
            let peek = match tri!(map.de.parse_whitespace()) {
                Some(b) => b,
                None => {
                    return Err(map.de.peek_error(ErrorCode::EofWhileParsingObject));
                }
            };
```

空白を飛ばし、次の文字を `peek` で見ます。ファイルの終わりなら、「オブジェクトの途中で終わった」というエラーを返します。`has_next_key` は、読み始める前に、この判定だけを行う内側の関数です。

### 2. 最初のキーの位置を確かめる

```rust:line-numbers=1998
            if peek == b'}' {
                Ok(false)
            } else if map.first {
                map.first = false;
                if peek == b'"' {
                    Ok(true)
                } else {
                    Err(map.de.peek_error(ErrorCode::KeyMustBeAString))
                }
```

閉じ括弧 `}` なら、キーはありません。最初の要素であれば、次の文字が `"` でなければ「キーは文字列でなければならない」というエラーになります。

### 3. 2 つ目以降のキーの前にあるカンマ

```rust:line-numbers=2007
            } else if peek == b',' {
                map.de.eat_char();
                match tri!(map.de.parse_whitespace()) {
                    Some(b'"') => Ok(true),
                    Some(b'}') => Err(map.de.peek_error(ErrorCode::TrailingComma)),
                    Some(_) => Err(map.de.peek_error(ErrorCode::KeyMustBeAString)),
                    None => Err(map.de.peek_error(ErrorCode::EofWhileParsingValue)),
                }
```

カンマを読み飛ばしてから、次の文字を見ます。その直後が `}` なら、末尾のカンマがあるのでエラーです。`"` なら、次のキーを読んでよいという意味で `true` を返します。

### 4. どれにも当てはまらないとき

```rust:line-numbers=2015
            } else {
                Err(map.de.peek_error(ErrorCode::ExpectedObjectCommaOrEnd))
            }
```

カンマでも閉じ括弧でもなければ、「カンマか閉じ括弧が必要」というエラーです。たとえば、2 つの組の間に区切りがない場合が該当します。

### 5. キーを読み取る

```rust:line-numbers=2020
        if tri!(has_next_key(self)) {
            Ok(Some(tri!(seed.deserialize(MapKey { de: &mut *self.de }))))
        } else {
            Ok(None)
        }
```

`has_next_key` が `true` を返したら、`MapKey` を渡して `seed.deserialize` を呼び、キーを読みます。`false` なら、`None` を返して、オブジェクトの終わりを伝えます。

## ここがすごい

- **読む前に確かめる**: 値を読む前に、区切りや終わりを `peek` で判定しています。失敗してもどの位置の問題かが分かり、読みかけの値を壊すことがありません。
- **エラーの種類が細かい**: 末尾のカンマ、文字列でないキー、途中での終わりなど、場面ごとに別のエラーコードを使っています。原因の特定がしやすくなります。
- **読みと型を分ける**: `DeserializeSeed` によって、キーの型を呼び出し側が決められます。JSON の文字列を、任意の型のキーに変換できます。
- **内側の関数で判定を閉じ込める**: `has_next_key` は、読み進める処理と判定だけを担当します。外側の `next_key_seed` は、結果に従って読むかどうかを決めるだけになります。

## まとめ

- 区切りやエラーの判定は、読み取りの前に行うと、失敗の原因が明確になります。
- エラーの種類を場面ごとに分けておくと、利用者が問題を見つけやすくなります。
- 読む処理と型の決定を分けておくと、同じ読み取りを別の型にも使えます。
