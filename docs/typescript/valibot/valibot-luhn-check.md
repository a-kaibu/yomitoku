---
title: "クレジットカード番号の検査に使う Luhn 法を、数字を一つずつ数えて確かめる"
description: "valibot の _isLuhnAlgo。右端から数字を交互に 2 倍して、各桁の合計が 10 の倍数かどうかを調べる。1 回のループで、2 倍のときだけ 9 を引く工夫をしている。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_isLuhnAlgo/_isLuhnAlgo.ts
lines: [11, 29]
function: "_isLuhnAlgo"
difficulty: 2
format: 2
tags: [アルゴリズム, 数値計算, 防御的プログラミング]
---

## ひとことで

`_isLuhnAlgo(input)` は、数字だけの文字列が **Luhn（ルーン）法** に合っているかを調べる関数です。クレジットカード番号などの入力ミスを見つけるために使われます。valibot では、カード番号の形式を検査する部品の中で使われています。

```ts
_isLuhnAlgo('79927398713') // true（Wikipedia の例として有名な正しい番号）
_isLuhnAlgo('79927398714') // false（最後の 1 桁が違う）
```

## コード

::: code-group

```ts:line-numbers=11 [日本語訳]
export function _isLuhnAlgo(input: string): boolean {
  // 変数を用意する
  let index = input.length;
  let bit = 1;
  let sum = 0;

  // アルゴリズムの合計を計算する
  while (index) {
    const charCode = input.charCodeAt(--index);
    if (charCode >= 48 && charCode <= 57) {
      const value = charCode - 48;
      bit ^= 1;
      sum += bit ? (value > 4 ? value * 2 - 9 : value * 2) : value;
    }
  }

  // 有効かどうかを返す
  return sum % 10 === 0;
}
```

```ts:line-numbers=11 [原文]
export function _isLuhnAlgo(input: string): boolean {
  // Create necessary variables
  let index = input.length;
  let bit = 1;
  let sum = 0;

  // Calculate sum of algorithm
  while (index) {
    const charCode = input.charCodeAt(--index);
    if (charCode >= 48 && charCode <= 57) {
      const value = charCode - 48;
      bit ^= 1;
      sum += bit ? (value > 4 ? value * 2 - 9 : value * 2) : value;
    }
  }

  // Return whether its valid
  return sum % 10 === 0;
}
```

:::

## 前提知識

- **Luhn 法**: 1954 年ごろに考案された、数字の入力ミスを見つけるための計算方法です。右端から数えて偶数番目の数字を 2 倍し、2 桁になったら各桁を足します。すべての数字の合計が 10 の倍数なら正しいとみなします。
- **`charCodeAt`**: 文字列の指定した位置の文字を、数の番号（文字コード）で返します。`'0'` は `48`、`'9'` は `57` です。
- **`--index`**: `index` を 1 減らしてから、その値を使う書き方です。ループを右端から左へ進めるために使っています。
- **`bit ^= 1`**: `bit` の 0 と 1 を入れ替える書き方です（排他的論理和）。「今の桁を 2 倍するか」を交互に切り替えるために使っています。
- **三項演算子 `条件 ? A : B`**: 条件が真なら A、偽なら B の値を使う書き方です。

## 何をしているか

### 1. 右端から 1 文字ずつ見ていく

```ts:line-numbers=18
  while (index) {
    const charCode = input.charCodeAt(--index);
```

`index` は文字列の長さから始まり、1 ずつ減っていきます。つまり右端から左へ向かって数字を見ます。

### 2. 数字でない文字は無視する

```ts:line-numbers=20
    if (charCode >= 48 && charCode <= 57) {
```

文字コードが `48`（`0`）から `57`（`9`）の範囲にある文字だけを数字として扱います。ハイフンや空白は、ここで飛ばされます。だからカード番号を `7992-7398-713` のように書いても計算できます。

### 3. 2 桁ごとに 2 倍する

```ts:line-numbers=22
      bit ^= 1;
      sum += bit ? (value > 4 ? value * 2 - 9 : value * 2) : value;
```

`bit` は数字が 1 つ見つかるごとに `1` と `0` を行き来します。`bit` が `1` のとき（右から 2 番目、4 番目…）は、数字を 2 倍して合計に足します。ただし、2 倍した値が 9 より大きい（5 以上の数字を 2 倍すると 2 桁になる）ときは、`value * 2 - 9` で 9 を引きます。これは「2 桁の数の各桁を足す」のと同じ結果になります。

### 4. 合計が 10 の倍数かを確かめる

```ts:line-numbers=28
  return sum % 10 === 0;
```

`sum % 10` は、10 で割った余りです。余りが `0` なら正しい番号、そうでなければ間違いです。

## ここがすごい

- **2 桁の足し算を引き算 1 回で置き換えている**: 例えば `7` を 2 倍すると `14` で、`1 + 4 = 5` と同じ結果になります。`14 - 9 = 5` なので、わざわざ文字列にして足す必要がありません。
- **1 回のループで済む**: 文字列を配列に変えたり、2 回走査したりせず、右から左へ 1 度だけ見ます。
- **数字以外を自動で捨てる**: 文字コードの範囲で判定するので、正規表現を使わず、ハイフンや空白を含む入力もそのまま受け取れます。
- **真偽値を式 1 つで返す**: 最後の `sum % 10 === 0` は、検査の結果を 1 行で表しています。

## まとめ

- Luhn 法は、右から偶数番目の数字を 2 倍して、合計が 10 の倍数かどうかを確かめる。
- 2 倍した値が 9 より大きいときは、9 を引くと 2 桁の各桁の和と同じになる。
- 文字の範囲で数字を選べば、入力の記号を気にせず計算できる。
- 配列を作らず、1 回のループで検査を済ませられる。
