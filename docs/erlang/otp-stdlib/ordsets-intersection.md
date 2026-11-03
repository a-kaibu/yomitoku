---
title: "並んだ集合どうしの共通部分を、1 回の走査で取り出す"
description: "ordsets:intersection/2 は、昇順に並んだ 2 つの集合の共通部分を作る。先頭どうしを比べて、小さい方を捨てながら進み、等しいものだけを結果に入れる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/ordsets.erl
lines: [344, 353]
function: "ordsets:intersection/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`ordsets:intersection/2` は、2 つの集合の共通部分（両方に含まれる要素）を作ります。`ordsets` は、昇順に並んだリストで集合を表します。
先頭どうしを比べて、小さい方の要素はもう共通にならないので捨てます。等しい要素だけを結果に入れます。

## コード

::: code-group

```erlang:line-numbers=344 [日本語訳]
intersection([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    intersection(Es1, Set2);
intersection([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    intersection(Es2, Set1);			% 引数を入れ替えて、同じ処理を逆向きに使う
intersection([E1|Es1], [_E2|Es2]) ->		%E1 と E2 が等しいとき
    [E1|intersection(Es1, Es2)];
intersection([], _) ->
    [];
intersection(_, []) ->
    [].
```

```erlang:line-numbers=344 [原文]
intersection([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    intersection(Es1, Set2);
intersection([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    intersection(Es2, Set1);			% switch arguments!
intersection([E1|Es1], [_E2|Es2]) ->		%E1 == E2
    [E1|intersection(Es1, Es2)];
intersection([], _) ->
    [];
intersection(_, []) ->
    [].
```

:::

## 前提知識

- **共通部分（積集合）**: 2 つの集合の両方に含まれる要素の集まりです。
- **昇順のリスト**: 要素が小さい順に並んでいるリストです。先頭から比べれば、どこまで読んだかが分かります。
- **`[E1|Es1]` と `[E2|_]=Set2`**: 先頭の要素と残りを取り出すパターンです。`=Set2` は、全体のリストにも名前を付けます。
- **`_E2`**: 使わない値を表す変数名です。
- **`[]` の節**: どちらかが空になったら、共通の要素はもうありません。空を返します。

## 何をしているか

### 1. 第 1 集合の先頭が小さいとき

```erlang:line-numbers=344
intersection([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    intersection(Es1, Set2);
```

`E1 < E2` なら、`E1` は第 2 集合のどの要素とも一致しません。`E1` を捨てて、残りを比べ直します。

### 2. 第 2 集合の先頭が小さいとき

```erlang:line-numbers=346
intersection([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    intersection(Es2, Set1);			% switch arguments!
```

逆に、`E1 > E2` なら `E2` を捨てます。コード上では、引数を入れ替えて同じ処理を使っています。

### 3. 等しいとき

```erlang:line-numbers=348
intersection([E1|Es1], [_E2|Es2]) ->		%E1 == E2
    [E1|intersection(Es1, Es2)];
```

`E1` と `E2` が等しければ、両方に含まれる要素です。`E1` を結果に入れ、両方の先頭を 1 つずつ進めます。

### 4. どちらかが空になったとき

```erlang:line-numbers=350
intersection([], _) ->
    [];
intersection(_, []) ->
    [].
```

どちらかが空になったら、比べる相手がいないので、残りの共通要素はありません。空のリストを返します。

## ここがすごい

### 小さい方を捨てる、という規則だけで書く

共通部分は、「比べて小さい方は、もう相手に現れない」という 1 つの規則で作れます。`union` と同じ比較の仕組みを使い、結果への追加だけを変えています。
同じ形の関数を並べて読むと、集合の演算の違いが分かりやすくなります。

### 等しいときだけ結果に入れる

等しい要素は、両方の集合に同時に現れています。そのため、等しい組だけを 1 回ずつ結果にします。重複を気にする必要はありません。
ソート済みの前提が、この簡単な判定を正しくしています。

## まとめ

- 並んだ集合の共通部分は、先頭どうしを比べて小さい方を捨てると、1 回の走査で求まります。
- 演算の違いは、等しいときや、捨てるときの動作に現れます。
- 集合の演算は、前提（並んでいること）を守ると、単純な規則で書けます。
