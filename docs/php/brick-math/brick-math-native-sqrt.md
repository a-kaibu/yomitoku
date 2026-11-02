---
title: 平方根の近似を、割り算の平均を繰り返して求める
description: brick/math の NativeCalculator::sqrt は、大きな整数の平方根を、ニュートン法と呼ばれる方法で求めます。答えに近づくたびに値を平均し、変化がなくなったところで止まります。
language: php
project: Brick Math
repo: https://github.com/brick/math
license: MIT
copyright: Copyright (c) 2013-present Benjamin Morel
commit: "ee4c0fbc8846e5aca58c8983f6f7d285de09ef89"
file: src/Internal/Calculator/NativeCalculator.php
lines: [266, 289]
function: NativeCalculator::sqrt
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 最適化]
---

## ひとことで

`sqrt` は、大きな整数の **平方根**（2 乗すると元の数になる数）を、整数の部分だけ求める関数です。`sqrt(10)` は約 3.16 ですが、整数で求めると 3 になります。桁数の制限がない整数でも、この方法なら計算できます。

## コード

::: code-group

```php:line-numbers=266 [日本語訳]
    public function sqrt(string $n): string
    {
        if ($n === '0') {
            return '0';
        }

        // 最初の近似値
        $x = str_repeat('9', intdiv(strlen($n), 2) ?: 1);

        $decreased = false;

        for (; ;) {
            $nx = $this->divQ($this->add($x, $this->divQ($n, $x)), '2');

            if ($x === $nx || $this->cmp($nx, $x) > 0 && $decreased) {
                break;
            }

            $decreased = $this->cmp($nx, $x) < 0;
            $x = $nx;
        }

        return $x;
    }
```

```php:line-numbers=266 [原文]
    public function sqrt(string $n): string
    {
        if ($n === '0') {
            return '0';
        }

        // initial approximation
        $x = str_repeat('9', intdiv(strlen($n), 2) ?: 1);

        $decreased = false;

        for (; ;) {
            $nx = $this->divQ($this->add($x, $this->divQ($n, $x)), '2');

            if ($x === $nx || $this->cmp($nx, $x) > 0 && $decreased) {
                break;
            }

            $decreased = $this->cmp($nx, $x) < 0;
            $x = $nx;
        }

        return $x;
    }
```

:::

## 前提知識

- **平方根**: ある数を 2 乗したら元の数になる数です。`sqrt(9) = 3` のように使います。
- **ニュートン法**: 答えの候補を少しずつ改善していく、古くからある近似の方法です。`(候補 + 元の数 ÷ 候補) ÷ 2` を繰り返すと、答えに近づきます。
- **整数の割り算**: 割り切れない場合に、小数点以下を捨てる割り算です。ここでは `divQ` がこれに当たります。
- **`cmp`**: 2 つの数の大小を比べる関数です。`0` なら等しく、負なら前が小さいことを表します。
- **`str_repeat`**: 同じ文字を指定した回数だけつないだ文字列を作る関数です。

## 何をしているか

### 1. 0 は、そのまま 0

```php:line-numbers=268
        if ($n === '0') {
            return '0';
        }
```

平方根が 0 である数は 0 だけなので、ここで答えを返します。

### 2. 最初の候補を決める

::: code-group

```php:line-numbers=272 [日本語訳]
        // 最初の近似値
        $x = str_repeat('9', intdiv(strlen($n), 2) ?: 1);
```

```php:line-numbers=272 [原文]
        // initial approximation
        $x = str_repeat('9', intdiv(strlen($n), 2) ?: 1);
```

:::

最初の候補 `$x` は、桁数の半分だけ `9` を並べた数にします。たとえば 10 進数で 6 桁の数なら、999 のように大きめの候補になります。大きめから始めると、値が必ず下に近づいていきます。

### 3. 候補を平均で改善する

```php:line-numbers=277
        for (; ;) {
            $nx = $this->divQ($this->add($x, $this->divQ($n, $x)), '2');

            if ($x === $nx || $this->cmp($nx, $x) > 0 && $decreased) {
```

`$nx` は `(x + n ÷ x) ÷ 2` です。これがニュートン法の 1 回分の改善です。候補 `x` が大きすぎれば `n ÷ x` は小さくなり、平均は両者の間にきます。

### 4. 変化がなくなったら止める

```php:line-numbers=282
            }

            $decreased = $this->cmp($nx, $x) < 0;
            $x = $nx;
        }
```

新しい候補 `$nx` が前の `$x` と同じになったら、答えが決まったので止めます。また、いったん小さくなったあとで大きくなり始めたら、整数の誤差で行ったり来たりしているので、そこでも止めます。

```php:line-numbers=288
        return $x;
```

最後の `$x` が、整数の平方根です。

具体例として `sqrt(10)` は、候補が `9 → 5 → 3 → 3` と変化し、`3` で止まります。

## ここがすごい

### 「良くなり続ける」限り、近づいていけることを使っている

ニュートン法は、候補が答えより大きいか小さいかにかかわらず、平均を取るたびに答えへ近づいていきます。最初に大きな値から始めると、途中で減り続けるだけで済みます。この性質を、`$decreased` のフラグで確かめて止めています。

### 整数だけで完結する

普通の平方根は小数を使いますが、この関数は整数の割り算だけで答えを求めます。桁数が大きい数でも、小数の誤差を気にせず正確な整数の答えが得られます。任意精度の数を扱う部品として、この設計は大事な役割を持っています。

### 無限ループを防ぐ止め方

ふつうは「変化しなくなったら止める」だけで十分です。しかし整数では、2 つの値が行ったり来たりすることがあります。大きくなり始めたら止める条件を入れることで、そのような場合でも必ず終わるようにしています。

## まとめ

- 平方根は、平均を繰り返すニュートン法で、答えに近づけられる。
- 最初の候補を大きめにすると、値が一方向に近づいて扱いやすい。
- 整数の割り算だけで計算すると、桁数の大きな数でも正確に求められる。
- 止める条件は、変化がなくなる場合と、行ったり来たりする場合の両方を考える。
