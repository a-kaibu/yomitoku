---
title: JSON のオブジェクトを 1 件ずつ Map に入れる
description: serde_json の Map 用 visit_map。キーと値の組を 1 つずつ受け取り、同じキーは後の値で上書きしながら Map に入れて返す。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/map.rs
lines: [537, 550]
function: visit_map
difficulty: 1
format: 2
tags: [入出力, 型システム, ジェネリクス]
---

## ひとことで

`visit_map` は、serde_json が JSON のオブジェクト（`{ "キー": 値, … }`）を読み込むときに、中身を 1 件ずつ受け取って `Map` に入れる関数です。`Map` は、JSON のオブジェクトを表す serde_json の型です。

データは、`MapAccess` という仲介役から順番に渡されます。この関数は、その仲介役から組を取り出し続け、なくなったら完成した `Map` を返します。

## コード

```rust:line-numbers=537
            #[cfg(any(feature = "std", feature = "alloc"))]
            #[inline]
            fn visit_map<V>(self, mut visitor: V) -> Result<Self::Value, V::Error>
            where
                V: de::MapAccess<'de>,
            {
                let mut values = Map::new();

                while let Some((key, value)) = tri!(visitor.next_entry()) {
                    values.insert(key, value);
                }

                Ok(values)
            }
```

## 前提知識

- **serde の `Visitor`**: データの形（列、マップなど）に応じて、値の作り方を決める型です。`visit_map` は、マップの形のデータを受け取る関数です。
- **`MapAccess`**: マップの要素を 1 つずつ渡してくれる仲介役です。`next_entry` は、次のキーと値の組を取り出します。組がなくなると `None` を返します。
- **`while let`**: パターンに合う間だけ繰り返す構文です。`Some` の間は続き、`None` で止まります。
- **`tri!` マクロ**: serde_json の中で使われる、`?` と同じ働きのマクロです。エラーなら、そのエラーを呼び出し元へ返します。
- **`cfg(any(feature = "std", feature = "alloc"))`**: 標準ライブラリかアロケータが使えるときだけ、この関数を含める条件です。`Map` は、ヒープへ要素を入れる必要があるからです。

## 何をしているか

### 1. 空の Map を用意する

```rust:line-numbers=543
                let mut values = Map::new();
```

`Map::new()` で、空のオブジェクトを作ります。以降の組は、この `values` に入れていきます。

### 2. 組を取り出して、挿入する

```rust:line-numbers=545
                while let Some((key, value)) = tri!(visitor.next_entry()) {
                    values.insert(key, value);
                }
```

`next_entry` で次の組を取り出します。取り出しに失敗したら、`tri!` によってエラーを返します。組があれば、キーと値を `insert` で `values` に入れます。同じキーが既にあれば、後の値で上書きされます。

### 3. 完成した Map を返す

```rust:line-numbers=549
                Ok(values)
```

組がなくなったら、`values` を `Ok` で包んで返します。ここまでで、オブジェクトの全部の組が 1 つの `Map` にまとまっています。

## ここがすごい

- **仲介役に任せる**: 関数は、次の組を取り出すことだけを考えればよく、データがどの形式かは知りません。JSON、ほかの形式、どれにも同じ書き方が使えます。
- **エラーは途中で止まる**: `tri!` によって、読み込みの失敗は、そのまま呼び出し元へ伝わります。途中まで読んだ不完全な `Map` が、外に出ることはありません。
- **Map を先に作って、後から埋める**: 組の数を先に知らなくてよいので、どんな大きさのオブジェクトにも同じ書き方で対応できます。
- **機能によって含めるかを決める**: `cfg` で、ヒープが使えない環境では、この実装を含めないようにしています。

## まとめ

- マップの読み込みは、仲介役から組を取り出して、1 つずつ入れるのが基本の形です。
- エラーをすぐ返す書き方にすると、不完全な結果が外に漏れません。
- 必要な機能（ヒープなど）がない環境は、`cfg` で明示的に分けると安全です。
