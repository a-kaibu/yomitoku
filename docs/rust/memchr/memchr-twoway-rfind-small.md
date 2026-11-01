---
title: 後ろから針を探す Two-Way 法の小さな版
description: memchr の Two-Way 法で、文字列の後ろ側から針を探す関数。文字の集合で大きく飛ばし、一致が近いときは critical 位置で判断して、ずらす量を決める。
language: rust
project: memchr
repo: https://github.com/BurntSushi/memchr
license: Unlicense OR MIT
copyright: Copyright (c) 2015 Andrew Gallant
commit: "bd6068c30e9074a90c285e47912fa0b047d07597"
file: src/arch/all/twoway.rs
lines: [317, 356]
function: TwoWay::rfind_small_imp
difficulty: 3
format: 2
tags: [文字列処理, アルゴリズム, 探索]
---

## ひとことで

`rfind_small_imp` は、長い文字列（ヘイスタック）の **後ろから** 針（ニードル）を探す関数です。`memchr` クレートの Two-Way 法という文字列検索の、後ろ向きの版にあたります。「小さい」という名前は、針が短い場合に使われる実装だという意味です。

ナイーブな方法は、一致しない位置で 1 つずつずらすので、同じ比較を何度も繰り返します。この関数は、針の中の「決定的な位置」（critical 位置）を使って、比較の結果から次にどれだけ飛べるかを決めます。

## コード

```rust:line-numbers=317
    fn rfind_small_imp(
        &self,
        haystack: &[u8],
        needle: &[u8],
        period: usize,
    ) -> Option<usize> {
        let nlen = needle.len();
        let mut pos = haystack.len();
        let mut shift = nlen;
        let first_byte = match needle.first() {
            None => return Some(pos),
            Some(&first_byte) => first_byte,
        };
        while pos >= nlen {
            if !self.0.byteset.contains(haystack[pos - nlen]) {
                pos -= nlen;
                shift = nlen;
                continue;
            }
            let mut i = cmp::min(self.0.critical_pos, shift);
            while i > 0 && needle[i - 1] == haystack[pos - nlen + i - 1] {
                i -= 1;
            }
            if i > 0 || first_byte != haystack[pos - nlen] {
                pos -= self.0.critical_pos - i + 1;
                shift = nlen;
            } else {
                let mut j = self.0.critical_pos;
                while j < shift && needle[j] == haystack[pos - nlen + j] {
                    j += 1;
                }
                if j >= shift {
                    return Some(pos - nlen);
                }
                pos -= period;
                shift = period;
            }
        }
        None
    }
```

この関数は、事前に計算された `critical_pos`（決定的な位置）と `period`（針の周期）を使います。`byteset` は、針に含まれるバイトの集合で、飛ばせる位置をすぐに判定するための表です。

## 前提知識

- **文字列検索**: 長い文字列の中に、短い針が現れる場所を見つける問題です。
- **Two-Way 法**: 針を 2 つの部分に分けて、比べる順序を工夫する検索法です。最悪の場合でも、比較の回数が長さに比例します。
- **critical 位置**: 針を前後に分けたときの境目です。ここでの比較の結果から、大きく飛べるかが決まります。
- **周期（`period`）**: 針が同じ並びを繰り返す長さです。一致の後にどれだけずらせるかを表します。
- **`byteset`**: 針に含まれるバイトを記録した集合です。`contains` で、そのバイトが針に含まれるかを素早く確かめられます。

## 何をしているか

### 1. 窓の先頭が針に含まれないなら、まるごと飛ぶ

```rust:line-numbers=330
        while pos >= nlen {
            if !self.0.byteset.contains(haystack[pos - nlen]) {
                pos -= nlen;
                shift = nlen;
                continue;
            }
```

`pos` は、今見ている窓の右端です。窓の先頭のバイトが `byteset` に含まれていなければ、その窓に一致はありえません。針の長さだけ左へ飛んで、次の窓に進みます。

### 2. 針の前側を、右から比べる

```rust:line-numbers=336
            let mut i = cmp::min(self.0.critical_pos, shift);
            while i > 0 && needle[i - 1] == haystack[pos - nlen + i - 1] {
                i -= 1;
            }
            if i > 0 || first_byte != haystack[pos - nlen] {
                pos -= self.0.critical_pos - i + 1;
                shift = nlen;
```

`i` を `critical_pos` と `shift` の小さいほうから始め、針と窓を右から左へ比べます。途中で違いがあれば、その違いの位置を使って、`pos` を大きく動かします。

### 3. 前側が一致したら、後側を比べる

```rust:line-numbers=343
            } else {
                let mut j = self.0.critical_pos;
                while j < shift && needle[j] == haystack[pos - nlen + j] {
                    j += 1;
                }
                if j >= shift {
                    return Some(pos - nlen);
                }
                pos -= period;
                shift = period;
            }
```

前側がすべて一致し、先頭のバイトも一致したら、後側（`critical_pos` 以降）を比べます。全部一致すれば、`pos - nlen` を返します。そうでなければ、周期だけ左へ飛び、`shift` を周期に切り替えます。

### 4. 見つからなければ `None`

```rust:line-numbers=355
        None
```

窓が針の長さより短くなったら、もう候補はありません。`None` を返します。

## ここがすごい

- **飛べる量が大きい**: 不一致の位置の情報から、針の長さや周期の単位で一気に飛べます。ナイーブな方法より、比較の回数が少なくなります。
- **集合で先に除外**: `byteset` で、一致しえない窓を比較なしで捨てられます。ランダムな文字列では、大部分の窓がこの段階で捨てられます。
- **比較の順序が決まっている**: 前側と後側を分けて比べるので、同じ位置を何度も読みすぎません。最悪の場合でも、計算量が保証されます。

## まとめ

- 後ろから針を探すときも、critical 位置と周期を使えば、大きく飛べる。
- 文字の集合で、一致しえない窓を比較なしで捨てる。
- 前側と後側を分けて比べることで、比較の回数を抑える。
