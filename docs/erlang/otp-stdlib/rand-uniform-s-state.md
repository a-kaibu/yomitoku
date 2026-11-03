---
title: "乱数の整数を、0 以上 1 未満の小数に直すビットの扱い"
description: "rand:uniform_s/1 は、状態から取り出した整数を、上位ビットだけ使って 2 の -53 乗の倍数に直す。53 ビットの精度を持つ浮動小数点数を、偏りなく作るための変換。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2015-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/rand.erl
lines: [1191, 1200]
function: "rand:uniform_s/1"
difficulty: 3
format: 2
tags: ["乱数", "数値計算", "ビット演算"]
---
## ひとことで

`rand:uniform_s/1` は、乱数の状態を受け取り、0 以上 1 未満の小数と、次の状態の組を返します。
小数の中身は、乱数生成器が作る整数から作ります。その整数の上位ビットだけを使い、2 の -53 乗を掛けることで、0 以上 1 未満の値にしています。

## コード

::: code-group

```erlang:line-numbers=1191 [日本語訳]
uniform_s(State = {#{uniform:=Uniform}, _}) ->
    Uniform(State);
uniform_s({#{bits:=Bits, next:=Next} = AlgHandler, R0}) ->
    {V, R1} = Next(R0),
    %% N * 2^(-53) の形の小数を作る
    {(V bsr (Bits - 53)) * ?TWO_POW_MINUS53, {AlgHandler, R1}};
uniform_s({#{max:=Max, next:=Next} = AlgHandler, R0}) ->
    {V, R1} = Next(R0),
    %% 古いアルゴリズム。分布の密度が一様ではない
    {V / (Max + 1), {AlgHandler, R1}}.
```

```erlang:line-numbers=1191 [原文]
uniform_s(State = {#{uniform:=Uniform}, _}) ->
    Uniform(State);
uniform_s({#{bits:=Bits, next:=Next} = AlgHandler, R0}) ->
    {V, R1} = Next(R0),
    %% Produce floats of the form N * 2^(-53)
    {(V bsr (Bits - 53)) * ?TWO_POW_MINUS53, {AlgHandler, R1}};
uniform_s({#{max:=Max, next:=Next} = AlgHandler, R0}) ->
    {V, R1} = Next(R0),
    %% Old algorithm with non-uniform density
    {V / (Max + 1), {AlgHandler, R1}}.
```

:::

## 前提知識

- **浮動小数点数の精度**: 倍精度の小数は、仮数部に 53 ビットの精度を持ちます。そのため、53 ビットの整数を 2 の -53 乗倍すると、ちょうど 0 以上 1 未満の値をすべて表せます。
- **`bsr`**: ビットを右にずらします。`V bsr (Bits - 53)` は、上位 53 ビットだけを残す操作です。
- **`Next(R0)`**: 乱数生成器の次の値 `V` と、新しい状態 `R1` を返す関数です。
- **状態の組 `{AlgHandler, R}`**: どのアルゴリズムを使うかと、その内部の状態をまとめた値です。
- **`uniform` と `max`**: 生成器によっては、特別な変換を持つ場合や、最大値だけを持つ場合があります。この記事では、主な経路だけを見ます。

## 何をしているか

### 1. 独自の変換を持つアルゴリズム

```erlang:line-numbers=1191
uniform_s(State = {#{uniform:=Uniform}, _}) ->
    Uniform(State);
```

状態の中に `uniform` という変換関数があれば、その関数に任せます。アルゴリズムごとに、小数への直し方が違うことがあるからです。

### 2. ビット数を持つアルゴリズム

```erlang:line-numbers=1193
uniform_s({#{bits:=Bits, next:=Next} = AlgHandler, R0}) ->
    {V, R1} = Next(R0),
    %% Produce floats of the form N * 2^(-53)
    {(V bsr (Bits - 53)) * ?TWO_POW_MINUS53, {AlgHandler, R1}};
```

`Next` で整数 `V` を得ます。`Bits` は、その整数のビット数です。上位 53 ビットを `V bsr (Bits - 53)` で取り出し、`?TWO_POW_MINUS53`（2 の -53 乗）を掛けます。結果は、0 以上 1 未満で、53 ビットの刻みを持つ小数です。

### 3. 最大値を持つアルゴリズム

```erlang:line-numbers=1197
uniform_s({#{max:=Max, next:=Next} = AlgHandler, R0}) ->
    {V, R1} = Next(R0),
    %% Old algorithm with non-uniform density
    {V / (Max + 1), {AlgHandler, R1}}.
```

最大値 `Max` だけを持つ古いアルゴリズムでは、`V / (Max + 1)` で小数にします。コメントにあるとおり、この方法は、値の散らばりが一様ではありません。

## ここがすごい

### 53 ビットに合わせて、無駄なく小数にする

小数の仮数部は 53 ビットです。整数の上位 53 ビットを使えば、その精度をすべて使い切れます。下位のビットを捨てるのも、精度を超えないためです。
さらに、2 の -53 乗を掛けるのは、2 進数の小数として正確に表せる掛け算なので、丸めの誤差が入りにくいです。

### 古い方法の欠点を、コメントで残す

最後の節は、古い方法を残しています。コメントには「密度が一様ではない」と書かれています。
新しい経路と古い経路を並べて書くと、なぜ変換を分けたのかが読み手に伝わります。

## まとめ

- 乱数の整数を小数にするときは、精度（ここでは 53 ビット）に合わせてビットを選ぶと、無駄がありません。
- 2 進数で正確に表せる係数（2 の累乗）を掛けると、丸めの誤差を減らせます。
- 古い方法を残す場合は、欠点をコメントに書いておくと、後から読む人が判断しやすくなります。
