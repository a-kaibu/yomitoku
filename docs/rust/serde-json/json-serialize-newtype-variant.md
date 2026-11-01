---
title: 1 要素の列挙型の値を、オブジェクトとして書き出す
description: "serde_json の serialize_newtype_variant。Enum::Variant(値) を {\"Variant\": 値} の形で書き出す。区切りやかっこを formatter に任せ、順に書いていく。"
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/ser.rs
lines: [233, 268]
function: serialize_newtype_variant
difficulty: 2
format: 2
tags: [入出力, 設計パターン]
---

## ひとことで

`serialize_newtype_variant` は、serde_json が `enum` の **新しい型のバリアント**（値を 1 つだけ持つもの。例: `Message::Text("hi")`）を JSON に書き出す関数です。書き出すときは、バリアントの名前をキーとし、中の値を値とした 1 組のオブジェクト `{"Text": "hi"}` の形にします。

この関数自身は、波かっこや `:` などの記号を直接書きません。記号の書き方は `formatter` という部品に任せ、関数はその順番だけを決めます。

## コード

```rust:line-numbers=233
    fn serialize_newtype_variant<T>(
        self,
        _name: &'static str,
        _variant_index: u32,
        variant: &'static str,
        value: &T,
    ) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        tri!(self
            .formatter
            .begin_object(&mut self.writer)
            .map_err(Error::io));
        tri!(self
            .formatter
            .begin_object_key(&mut self.writer, true)
            .map_err(Error::io));
        tri!(self.serialize_str(variant));
        tri!(self
            .formatter
            .end_object_key(&mut self.writer)
            .map_err(Error::io));
        tri!(self
            .formatter
            .begin_object_value(&mut self.writer)
            .map_err(Error::io));
        tri!(value.serialize(&mut *self));
        tri!(self
            .formatter
            .end_object_value(&mut self.writer)
            .map_err(Error::io));
        self.formatter
            .end_object(&mut self.writer)
            .map_err(Error::io)
    }
```

## 前提知識

- **serde の `Serializer`**: データを書き出す側の仕組みを表すトレイトです。`serialize_newtype_variant` は、その中の 1 つのメソッドで、値を 1 つ持つバリアントの書き出しを担当します。
- **外部タグ付きの表現**: serde の既定の列挙型の表し方です。バリアントの名前をオブジェクトのキーにし、中身を値にします。
- **`Formatter`**: serde_json で、JSON の記号（`{`、`:`、`,` など）の書き方を決める部品です。空白や改行の有無も、この部品が決めます。
- **`tri!` マクロ**: `?` と同じ働きのマクロです。書き出しに失敗したら、そのエラーを呼び出し元に返します。
- **`map_err(Error::io)`**: 入出力のエラーを、serde_json のエラーの型に変換する操作です。

## 何をしているか

### 1. オブジェクトを開き、キーを書く

```rust:line-numbers=243
        tri!(self
            .formatter
            .begin_object(&mut self.writer)
            .map_err(Error::io));
        tri!(self
            .formatter
            .begin_object_key(&mut self.writer, true)
            .map_err(Error::io));
        tri!(self.serialize_str(variant));
```

まず `begin_object` で `{` に当たる記号を書きます。続けて `begin_object_key` と、バリアントの名前の文字列を書き、`end_object_key` でキーを閉じます。`serialize_str` が、名前を JSON の文字列として書きます。

### 2. 値を書く

```rust:line-numbers=252
        tri!(self
            .formatter
            .end_object_key(&mut self.writer)
            .map_err(Error::io));
        tri!(self
            .formatter
            .begin_object_value(&mut self.writer)
            .map_err(Error::io));
        tri!(value.serialize(&mut *self));
```

`begin_object_value` で `:` に当たる記号を書きます。その後、中の値を `value.serialize` で書きます。値の書き方は、値の型に任せています。

### 3. オブジェクトを閉じる

```rust:line-numbers=261
        tri!(self
            .formatter
            .end_object_value(&mut self.writer)
            .map_err(Error::io));
        self.formatter
            .end_object(&mut self.writer)
            .map_err(Error::io)
```

`end_object_value` で値の終わりを書き、最後に `end_object` で `}` を書きます。最後の書き込みの結果を、そのまま戻り値にします。

## ここがすごい

- **記号を formatter に任せる**: 関数の中には、`{` や `:` の文字がありません。整形の方法（`pretty` 形式や、空白を省く形式など）を変えても、この関数はそのまま動きます。
- **書き出しの順序だけに集中する**: 関数は、開く、キーを書く、値を書く、閉じるという順序だけを表しています。書き方の細部から分けられているので、読みやすくなっています。
- **値の書き方を委ねる**: `value.serialize(&mut *self)` によって、値の型が何であれ、その型の書き出し方が使われます。新しい型を追加しても、この関数は変わりません。
- **途中の失敗を伝える**: どの段階で書き込みに失敗しても、`tri!` によってすぐに戻ります。途中まで書かれた JSON が、正常な結果として返ることはありません。

## まとめ

- 形式の決まったデータを書き出すときは、記号と順序を分けると、整形の変更に強くなります。
- 外部から渡された値の書き方は、その型に任せると、拡張しやすくなります。
- 書き込みの各段階で失敗を伝えると、不完全な出力を防げます。
