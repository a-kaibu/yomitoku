---
title: "文字列の先頭だけを大文字にするとき、書記素を単位にする"
description: "string:titlecase/1 は、文字列の先頭の書記素（見た目の 1 文字）だけをタイトルケースにする。結合文字やサロゲートペアを 1 文字として扱うため、Unicode の文字列でも崩れない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [698, 709]
function: "string:titlecase/1"
difficulty: 2
format: 2
tags: ["文字列処理", "Unicode"]
---
## ひとことで

`string:titlecase/1` は、文字列の先頭の文字だけを「タイトルケース」にします。タイトルケースは、単語の先頭を大文字にする形のことです。
ただし、ここで言う「先頭の文字」は、コードポイント 1 つではなく、書記素（見た目で 1 文字に見えるまとまり）です。そのため、結合文字を含む文字でも正しく扱えます。

## コード

```erlang:line-numbers=698
titlecase(CD) when is_list(CD) ->
    case unicode_util:titlecase(CD) of
        [GC|Tail] -> append(GC,Tail);
        Empty -> Empty
    end;
titlecase(CD) when is_binary(CD) ->
    case unicode_util:titlecase(CD) of
        [CP|Chars] when is_integer(CP) -> <<CP/utf8,Chars/binary>>;
        [CPs|Chars] ->
            << << <<CP/utf8>> || CP <- CPs>>/binary, Chars/binary>>;
        [] -> <<>>
    end.
```

## 前提知識

- **コードポイント**: Unicode で、文字 1 つに割り当てられた番号です。`$a` や `$あ` のように書きます。
- **書記素（grapheme）**: 人が見て 1 文字と感じるまとまりです。`é` が「e」と結合記号の 2 つのコードポイントでできていても、見た目では 1 文字です。
- **リストとバイナリ**: Erlang の文字列は、コードポイントのリストか、UTF-8 のバイナリで表せます。この関数は両方を扱います。
- **`unicode_util:titlecase/1`**: 書記素の単位で、タイトルケースに変換する関数です。戻り値の先頭が、最初の書記素になります。
- **`append/2`**: 2 つのリストをつなぎます。`string:append/2` は、文字列の連結です。
- **`<<CP/utf8, Chars/binary>>`**: コードポイント `CP` を UTF-8 のバイト列として書き込み、残りの `Chars` をつなぎます。

## 何をしているか

### 1. リストで渡されたとき

```erlang:line-numbers=698
titlecase(CD) when is_list(CD) ->
    case unicode_util:titlecase(CD) of
        [GC|Tail] -> append(GC,Tail);
        Empty -> Empty
    end;
```

文字列がリストのときは、`unicode_util:titlecase/1` に渡します。戻り値の先頭 `GC` が、最初の書記素です。そのあとの `Tail` は、変換されていない残りです。`append(GC, Tail)` で、2 つをつないで返します。
空のときは、そのまま空を返します。

### 2. バイナリで渡されたとき

```erlang:line-numbers=703
titlecase(CD) when is_binary(CD) ->
    case unicode_util:titlecase(CD) of
        [CP|Chars] when is_integer(CP) -> <<CP/utf8,Chars/binary>>;
```

バイナリのときも、同じ変換を行います。先頭の要素 `CP` が整数なら、1 つのコードポイントです。UTF-8 の 1 文字分のバイト列として書き込みます。

### 3. 先頭が複数のコードポイントのとき

```erlang:line-numbers=706
        [CPs|Chars] ->
            << << <<CP/utf8>> || CP <- CPs>>/binary, Chars/binary>>;
```

先頭の書記素が、複数のコードポイントからできているときは、`CPs` がリストになります。それぞれを UTF-8 でバイナリにしたものを、残りの `Chars` とつなぎます。

### 4. 空のバイナリ

```erlang:line-numbers=708
        [] -> <<>>
    end.
```

変換する文字がなければ、空のバイナリ `<<>>` を返します。

## ここがすごい

### 文字の単位を、書記素にそろえている

大文字化を、そのまま 1 コードポイントずつ行うと、結合文字だけが残ってしまうことがあります。書記素の単位で扱うと、見た目の 1 文字を丸ごと変換できます。
文字列の型（リストかバイナリか）が違っても、同じ書記素の規則で処理されるので、結果が食い違いません。

### 変換の本体を Unicode の処理に任せる

大文字と小文字の対応は、言語や文字によって複雑です。この関数は、その規則を `unicode_util` に任せています。
自分で表を持つのではなく、標準のデータを使うことで、文字の種類が増えても同じ仕組みで扱えます。

## まとめ

- 先頭の文字だけを変える処理は、コードポイントではなく書記素を単位にすると安全です。
- リストとバイナリの両方を、同じ規則で処理できるように分けて書くと、読みやすくなります。
- 文字の対応表は自分で持たず、Unicode の仕組みに任せると、正確さを保てます。
