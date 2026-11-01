---
title: 割り算をせずに 5 で何回割れるかを数える
description: ryu が、値が 5 の何乗で割り切れるかを数える関数。5 の逆元を掛けて大小を比べる方法で、割り算を使わずに数える。
language: rust
project: ryu
repo: https://github.com/dtolnay/ryu
license: Apache-2.0 OR BSL-1.0
copyright: Copyright 2018 Ulf Adams (ソースファイルのヘッダによる)
commit: "75f9e707e77c89717ffb9c2a01fe2c28a016cc82"
file: src/d2s_intrinsics.rs
lines: [39, 52]
function: pow5_factor
difficulty: 3
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

`pow5_factor` は、ある整数 `value` が **5 で何回割り切れるか** を数える関数です。たとえば `value` が 250（= 2 × 5³）なら、答えは 3 になります。
普通は `value % 5` を繰り返して割り算で数えますが、この関数は **割り算を一度も使いません**。代わりに、掛け算と比べる操作だけで数えます。

この関数は `ryu` の中で、「値が 5^p で割り切れるか」を調べるのに使われます。浮動小数点数を 10 進数に変換するとき、その判定が頻繁に必要になります。

## コード

::: code-group

```rust:line-numbers=39 [日本語訳]
pub(crate) fn pow5_factor(mut value: u64) -> u32 {
    const M_INV_5: u64 = 14757395258967641293; // 5 の逆元 m_inv_5 について 5 * m_inv_5 = 1 (mod 2^64)
    const N_DIV_5: u64 = 3689348814741910323; // #{ n | n = 0 (mod 2^64) } は 2^64 / 5 に等しい
    let mut count = 0u32;
    loop {
        debug_assert!(value != 0);
        value = value.wrapping_mul(M_INV_5);
        if value > N_DIV_5 {
            break;
        }
        count += 1;
    }
    count
}
```

```rust:line-numbers=39 [原文]
pub(crate) fn pow5_factor(mut value: u64) -> u32 {
    const M_INV_5: u64 = 14757395258967641293; // 5 * m_inv_5 = 1 (mod 2^64)
    const N_DIV_5: u64 = 3689348814741910323; // #{ n | n = 0 (mod 2^64) } = 2^64 / 5
    let mut count = 0u32;
    loop {
        debug_assert!(value != 0);
        value = value.wrapping_mul(M_INV_5);
        if value > N_DIV_5 {
            break;
        }
        count += 1;
    }
    count
}
```

:::

定数の `M_INV_5` は、5 の逆元（5 を掛けると 1 になる、2^64 を法とした数）です。`N_DIV_5` は、5 の倍数の値が取りうる上限の目安です。

## 前提知識

- **法（mod）**: 2^64 で割った余りだけを考える計算です。`u64` の `wrapping_mul` は、この 2^64 を法とした掛け算に相当します。
- **逆元**: 整数 `a` と `b` があり `a × b ≡ 1 (mod 2^64)` を満たすとき、`b` は `a` の逆元です。5 は奇数なので、2^64 を法として逆元を持ちます。
- **`wrapping_mul`**: 掛け算の結果が `u64` の範囲を超えたら、上位を捨てて、2^64 で割った余りを返す掛け算です。
- **`debug_assert!`**: デバッグビルドでだけ条件を確かめるマクロです。リリースビルドでは実行されません。
- **5 の倍数の個数**: `value` が 5 で割り切れる回数は、0 になるまで 5 で割っていく回数と同じです。

## 何をしているか

### 1. 逆元を掛けて、5 の倍数かどうかを判定する

```rust:line-numbers=44
        debug_assert!(value != 0);
        value = value.wrapping_mul(M_INV_5);
        if value > N_DIV_5 {
```

`value` に `M_INV_5` を掛けると、`value` が 5 の倍数のとき、その結果は `value / 5` になります（2^64 を法とした計算で）。5 の倍数でないときは、結果が `N_DIV_5` より大きくなるように定数が選ばれています。
そのため、結果の大小を比べるだけで、5 で割り切れたかどうかが分かります。

### 2. 割り切れたら数を増やして、もう一度試す

```rust:line-numbers=47
            break;
        }
        count += 1;
    }
```

`value > N_DIV_5` のときは、ループを抜けます。それ以外のときは、`value` は 5 で割り切れていて、すでに `value / 5` になっているので、`count` を 1 増やして繰り返します。
ループの中で `value` は、割り切れるたびに 5 分の 1 になります。割り切れなくなった時点で、そこまでの回数が答えです。

```rust:line-numbers=56
pub fn multiple_of_power_of_5(value: u64, p: u32) -> bool {
    // I tried a case distinction on p, but there was no performance difference.
    pow5_factor(value) >= p
}
```

上の `multiple_of_power_of_5` は、この関数の結果が `p` 以上かを比べるだけです。`5^p` で割り切れるかどうかは、「5 で `p` 回以上割れるか」に言い換えられます。

## ここがすごい

- **割り算を使わない**: 5 で割る操作は、本来は割り算か、乗算と右ずらしの組み合わせで実装されます。この関数は、逆元による掛け算と 1 回の比較だけで、割れるかどうかを判定しています。
- **判定と商を同時に得る**: 割り切れたときには、掛けた結果がそのまま商になっています。判定のために割り、商を別に求める必要がありません。
- **比較 1 回で割り切れるかが分かる**: 5 の倍数かどうかは、掛け算の結果が上限より小さいかどうかだけで決まります。分岐が少なく、CPU の予測もしやすくなります。
- **型ごとの工夫を省く**: コメントにあるように、`p` で分けた別のコードも試されましたが、性能の差がなかったためこの形になっています。
- **リリースで消える確認**: `debug_assert!(value != 0)` は、0 は無限に 5 で割り切れるので、そもそも渡してはいけない値であることを開発中に確かめるためのものです。

## まとめ

- 5 の逆元を 2^64 を法として掛けると、5 の倍数だけが小さい値に写る。
- 割り切れたときの結果は、そのまま 5 分の 1 の値になるので、回数を数えながら割り続けられる。
- 割り算を使わずに「5 で何回割れるか」を求められる。
