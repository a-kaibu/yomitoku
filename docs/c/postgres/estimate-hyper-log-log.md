---
title: "調和平均で「異なる値の数」を見積もり、両端だけ補正する"
description: "HyperLogLog の箱に記録された値から、異なる値の個数を推定する関数。2 のマイナス乗の調和平均で基本の推定値を出し、小さすぎるときは空の箱の数、大きすぎるときはハッシュの衝突を考えて補正する。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL AND MIT
copyright: "Portions Copyright (c) 2014-2026, PostgreSQL Global Development Group; Copyright (c) 2013 Hideaki Ohno"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/hyperloglog.c
lines: [182, 221]
function: "estimateHyperLogLog"
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算, データ構造]
---

## ひとことで

`estimateHyperLogLog` は、HyperLogLog に加えた値のなかで **異なる値がいくつあったか** を推定して返します。
HyperLogLog は、たくさんの箱（レジスタ）それぞれに「その箱に来たハッシュ値のうち、先頭の 0 が最も長く続いた長さ + 1」を記録しています。この関数はその記録から、論文で示された式で個数を計算します。
たとえば箱が 16 個で、どの箱にも 3 が入っているなら、基本の推定値は `0.673 × 16² / (16 × 2⁻³) ≈ 86` 個です。

## コード

::: code-group

```c:line-numbers=182 [日本語訳]
/*
 * これまでに加えた要素をもとに、カーディナリティを推定する
 */
double
estimateHyperLogLog(hyperLogLogState *cState)
{
	double		result;
	double		sum = 0.0;

	for (Size i = 0; i < cState->nRegisters; i++)
	{
		sum += 1.0 / pow(2.0, cState->hashesArr[i]);
	}

	/* result には「生の」HyperLogLog 推定値（論文の E）が入る */
	result = cState->alphaMM / sum;

	if (result <= (5.0 / 2.0) * cState->nRegisters)
	{
		/* 小さい範囲の補正 */
		int			zero_count = 0;

		for (Size i = 0; i < cState->nRegisters; i++)
		{
			if (cState->hashesArr[i] == 0)
				zero_count++;
		}

		if (zero_count != 0)
			result = cState->nRegisters * log((double) cState->nRegisters /
											  zero_count);
	}
	else if (result > (1.0 / 30.0) * POW_2_32)
	{
		/* 大きい範囲の補正 */
		result = NEG_POW_2_32 * log(1.0 - (result / POW_2_32));
	}

	return result;
}
```

```c:line-numbers=182 [原文]
/*
 * Estimates cardinality, based on elements added so far
 */
double
estimateHyperLogLog(hyperLogLogState *cState)
{
	double		result;
	double		sum = 0.0;

	for (Size i = 0; i < cState->nRegisters; i++)
	{
		sum += 1.0 / pow(2.0, cState->hashesArr[i]);
	}

	/* result set to "raw" HyperLogLog estimate (E in the HyperLogLog paper) */
	result = cState->alphaMM / sum;

	if (result <= (5.0 / 2.0) * cState->nRegisters)
	{
		/* Small range correction */
		int			zero_count = 0;

		for (Size i = 0; i < cState->nRegisters; i++)
		{
			if (cState->hashesArr[i] == 0)
				zero_count++;
		}

		if (zero_count != 0)
			result = cState->nRegisters * log((double) cState->nRegisters /
											  zero_count);
	}
	else if (result > (1.0 / 30.0) * POW_2_32)
	{
		/* Large range correction */
		result = NEG_POW_2_32 * log(1.0 - (result / POW_2_32));
	}

	return result;
}
```

:::

## 前提知識

- **HyperLogLog**: 異なる値の個数を、小さな一定のメモリで推定するアルゴリズムです。各箱の値 `M` は「だいたい 2^M 個ぶんの値を見た」ことを示唆します。
- **`double`**: 小数を扱う型です。`1.0 / pow(2.0, x)` は 2 の −x 乗、つまり 1/2ˣ です。`pow`、`log`（自然対数）は `<math.h>` の関数です。
- **調和平均**: 値の逆数を平均して、その逆数をとる平均の取り方です。極端に大きな値の影響を受けにくい性質があります。
- **`cState->...`**: ポインタ `cState` が指す構造体の項目です。`nRegisters` は箱の数 m、`hashesArr` は箱の配列、`alphaMM` は初期化のときに計算しておいた `α × m²` です（α は偏りを直す補正係数で、m = 16 なら 0.673）。
- **`for (Size i = 0; ...)`**: ループの中だけで使う変数 `i` を、`for` の中で宣言しています。`Size` は大きさを表す符号なし整数の型です。
- **`POW_2_32`**: ファイルの先頭で `4294967296.0`（2³²）と定義された定数です。

## 何をしているか

### 1. 基本の推定値を出す

```c:line-numbers=191
	for (Size i = 0; i < cState->nRegisters; i++)
	{
		sum += 1.0 / pow(2.0, cState->hashesArr[i]);
	}

	/* result には「生の」HyperLogLog 推定値（論文の E）が入る */
	result = cState->alphaMM / sum;
```

すべての箱について `2^(-M)` を足し合わせ、`α m² / 合計` を計算します。これが論文で E と呼ばれる「生の推定値」です（コードのコメントより）。
16 個の箱すべてが 3 なら、合計は `16 × 1/8 = 2` で、`0.673 × 256 / 2 ≈ 86` です。

### 2. 少ない場合の補正

```c:line-numbers=199
	if (result <= (5.0 / 2.0) * cState->nRegisters)
	{
		/* 小さい範囲の補正 */
		int			zero_count = 0;

		for (Size i = 0; i < cState->nRegisters; i++)
		{
			if (cState->hashesArr[i] == 0)
				zero_count++;
		}

		if (zero_count != 0)
			result = cState->nRegisters * log((double) cState->nRegisters /
											  zero_count);
	}
```

推定値が箱の数の 2.5 倍以下のときは、値が少なすぎて生の推定値が不正確になります。このときは **空の箱（値が 0）の数** を数え、`m × ln(m / 空の箱の数)` で推定し直します。
たとえば 16 個中 10 個が空なら、`16 × ln(16/10) ≈ 7.5` 個です。値をランダムに箱へ投げ込んだとき、空の箱がどれだけ残るかから個数を逆算する考え方です（Linear Counting と呼ばれます）。空の箱が 0 個なら、この補正は使えないので生の推定値のままにします。

### 3. 多い場合の補正

```c:line-numbers=214
	else if (result > (1.0 / 30.0) * POW_2_32)
	{
		/* 大きい範囲の補正 */
		result = NEG_POW_2_32 * log(1.0 - (result / POW_2_32));
	}
```

推定値が 2³² の 30 分の 1 を超えると、32 ビットのハッシュ値どうしの衝突（違う値が同じハッシュ値になること）が無視できなくなります。そこで `-2³² × ln(1 - E/2³²)` で補正し、衝突で見えなくなった分を足し戻します。

## ここがすごい

- **調和平均でぶれを抑える**: 箱の値は確率的に決まるので、たまに大きな値が出ます。素直に `2^M` を算術平均すると、その 1 個に推定全体が引っ張られます。逆数 `2^(-M)` を平均すると、大きな `M` の影響は小さくなり、推定が安定します。HyperLogLog の名前の由来でもある工夫です。
- **得意な範囲ごとに式を使い分ける**: 生の推定式は中くらいの個数で精度が良く、両端で偏ります。少ない側は空の箱の数、多い側はハッシュの衝突確率という、それぞれの範囲でより確かな情報を使って補正しています。3 つの式を条件分岐でつないだ、論文どおりの構成です。
- **重い計算は前もって済ませる**: `α × m²` は箱の数だけで決まるので、初期化のときに一度だけ計算して `alphaMM` に保存しています。推定のたびに場合分けや掛け算をやり直さずに済みます。
- **補正できないときは無理をしない**: `zero_count != 0` の確認がないと、空の箱が無いときに `log(m / 0)` という意味のない計算になります。条件を確かめて、生の推定値に任せています。

## まとめ

- HyperLogLog の推定は、箱ごとの `2^(-M)` の調和平均に補正係数を掛けて求める。
- 調和平均は、たまたま大きく出た値の影響を抑える。
- 値が少ないときは空の箱の数から、多いときはハッシュの衝突を考えて補正する。
- 箱の数だけで決まる定数は、初期化時に計算しておく。
