---
title: "正規表現の繰り返しが大きくなりすぎないかを先に確かめる repeatIsValid"
description: "正規表現の {n,m} の繰り返し回数が、入れ子になったときに大きくなりすぎないかを調べる関数。掛け算の大きさを、割り算で残りの上限として少しずつ減らしながら確かめる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [452, 474]
function: "repeatIsValid"
difficulty: 3
tags: [正規表現, アルゴリズム, 防御的プログラミング]
---

## ひとことで

`repeatIsValid` は、正規表現の繰り返し（例えば `(a{2}){3}`）が、展開したときに大きくなりすぎないかを調べる関数です。`a{1000}{1000}` のように入れ子で繰り返すと、内部のプログラムが何百万もの命令になってしまいます。それを、パースの段階で止めるための確認です。

戻り値が `true` なら、その繰り返しは許される範囲にあります。`false` なら、エラーとして扱われます。

## コード

```go:line-numbers=452
func repeatIsValid(re *Regexp, n int) bool {
	if re.Op == OpRepeat {
		m := re.Max
		if m == 0 {
			return true
		}
		if m < 0 {
			m = re.Min
		}
		if m > n {
			return false
		}
		if m > 0 {
			n /= m
		}
	}
	for _, sub := range re.Sub {
		if !repeatIsValid(sub, n) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **正規表現の繰り返し**: `a{2,5}` は「a を 2〜5 回」、`(ab)*` は「ab を 0 回以上」という意味です。
- **木構造の式**: 正規表現は、1 つの式が中の式（子）を持つ木として表されます。`re.Sub` は子の式のスライスです。
- **繰り返しの上限 `Max`、下限 `Min`**: `Max` が `-1` のときは上限なしで、そのときは下限 `Min` を使って判定します。
- **割り算で残りを減らす**: 入れ子の中で、外側の繰り返し回数を「残りの上限」から割っていくと、積が上限を超えるかどうかを、掛け算せずに調べられます。

## 何をしているか

### 1. 繰り返しの回数を決める

```go:line-numbers=453
	if re.Op == OpRepeat {
		m := re.Max
		if m == 0 {
			return true
		}
		if m < 0 {
			m = re.Min
		}
```

今の式が繰り返し `OpRepeat` なら、その回数 `m` を決めます。上限がなければ下限を使います。`m == 0` の繰り返しは、中身を何回も展開しないので、問題がありません。

### 2. 残りの上限と比べる

```go:line-numbers=461
		if m > n {
			return false
		}
		if m > 0 {
			n /= m
		}
```

`n` は、ここまでの繰り返しで残っている上限です。`m` が `n` より大きければ、この繰り返しだけで上限を超えるので、`false` です。そうでなければ、`n` を `m` で割って、子の式に渡す残りの上限にします。

### 3. 子の式にも同じ確認をする

```go:line-numbers=468
	for _, sub := range re.Sub {
		if !repeatIsValid(sub, n) {
			return false
		}
	}
	return true
```

子の式が繰り返しを含むかもしれないので、子を 1 つずつ確認します。どれか 1 つでも `false` なら、全体を `false` にします。

## ここがすごい

- **掛け算をせずに判定する**: `a{1000}{1000}` の展開サイズは 100 万ですが、掛け算の結果を作らずに、`n` を割り算で減らしながら比べています。大きすぎる数を作らない工夫です。
- **残りの上限を子に渡す**: 外側の繰り返しで使った分を割り引いてから子に渡すので、子は「残りにいくつ余裕があるか」だけを考えればよくなります。
- **木をたどるだけの再帰**: 子の式を同じ関数で調べるので、どれだけ深く入れ子になっていても、同じ規則で判定できます。

## まとめ

- `repeatIsValid` は、入れ子の繰り返しが大きくなりすぎないかをパースの段階で確かめます。
- 残りの上限 `n` を、繰り返しの回数 `m` で割りながら子に渡します。
- 掛け算の結果を作らず、割り算で判定するので、大きな数で溢れる心配がありません。
- 子の式も同じ関数で調べ、どこか 1 か所でも超えれば拒否します。
