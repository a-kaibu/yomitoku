---
title: "ASCII なら 8 バイトずつ一気に飛ばす UTF-8 検証"
description: "文字列が正しい UTF-8 かを調べる utf8.ValidString。ASCII が続く部分は、8 バイト（さらに 16、32 バイト）をまとめて読み、最上位ビットだけを一度に検査して高速に読み飛ばします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [522, 566]
function: "ValidString"
difficulty: 3
tags: [Unicode, 最適化, ビット演算, 文字列処理, 標準ライブラリ]
---

## ひとことで

`utf8.ValidString(s)` は、文字列 `s` が **正しい UTF-8 のバイト列かどうか** を返します。
ファイルやネットワークから受け取ったデータが文字化けしていないか調べるときなどに使います。

工夫の中心は、**ASCII（英数字など）が続く部分を、1 バイトずつではなく 8 バイト単位でまとめて確認する** ことです。

## コード

```go:line-numbers=522
func ValidString(s string) bool {
	for len(s) > 0 {
		s0 := s[0]
		if s0 < RuneSelf {
			s = s[1:]
			// If there's one ASCII byte, there are probably more.
			// Advance quickly through ASCII-only data.
			// Note: using > instead of >= here is intentional. That avoids
			// needing pointing-past-the-end fixup on the slice operations.
			if len(s) > ptrSize && word(s)&hiBits == 0 {
				s = s[ptrSize:]
				if len(s) > 2*ptrSize && (word(s)|word(s[ptrSize:]))&hiBits == 0 {
					s = s[2*ptrSize:]
					for len(s) > 4*ptrSize && ((word(s)|word(s[ptrSize:]))|(word(s[2*ptrSize:])|word(s[3*ptrSize:])))&hiBits == 0 {
						s = s[4*ptrSize:]
					}
				}
			}
			continue
		}
		x := first[s0]
		size := int(x & 7)
		accept := acceptRanges[x>>4]
		switch size {
		case 2:
			if len(s) < 2 || s[1] < accept.lo || accept.hi < s[1] {
				return false
			}
			s = s[2:]
		case 3:
			if len(s) < 3 || s[1] < accept.lo || accept.hi < s[1] || s[2] < locb || hicb < s[2] {
				return false
			}
			s = s[3:]
		case 4:
			if len(s) < 4 || s[1] < accept.lo || accept.hi < s[1] || s[2] < locb || hicb < s[2] || s[3] < locb || hicb < s[3] {
				return false
			}
			s = s[4:]
		default:
			return false // illegal starter byte
		}
	}
	return true
}
```

`ptrSize` は 64 ビット環境で 8、`hiBits` は `0x8080808080808080`（各バイトの最上位ビットだけ 1）、`word(s)` は `s` の先頭 8 バイトを 1 つの整数として読む関数です（459〜462 行目）。

## 前提知識

- **UTF-8 と ASCII**: UTF-8 では、ASCII の文字は 1 バイトで最上位ビットが 0（値が 128 未満）です。それ以外の文字のバイトは、すべて最上位ビットが 1 です。
- **`s = s[1:]`**: 文字列の先頭 1 バイトを取り除いた部分文字列にします。コピーは起きず、見ている範囲がずれるだけです。
- **`&` によるまとめての検査**: 8 バイトを 1 つの 64 ビット整数として読み、`hiBits` と `&` を取ると、**8 バイトの最上位ビットを一度に** 調べられます。結果が 0 なら 8 バイトすべてが ASCII です。
- **`|` で束ねる**: 複数の整数を OR でまとめてから `hiBits` と `&` を取れば、16 バイトや 32 バイトでも 1 回の検査で済みます。
- **`switch size`**: `size` の値で処理を分けます。どれにも当てはまらなければ `default` が実行されます。

## 何をしているか

### 1. ASCII の高速道（524〜541 行目）

先頭が ASCII なら 1 バイト進めます。「1 つ ASCII があれば、たぶん続く」（527 行目）ので、次の 8 バイトをまとめて検査し、すべて ASCII なら 8 バイト飛ばします。さらに 16 バイト（533 行目）、そして 32 バイトずつ（535〜537 行目）と、まとめる量を増やしていきます。

たとえば英文 100 バイトなら、1 バイトずつ調べると 100 回の比較が要りますが、この方法なら 1 + 8 + 16 + 32 + 32... と大きく飛ばせるので、10 回程度の検査で終わります。

### 2. ASCII 以外の文字（542〜563 行目）

先頭バイトを `first` 表で引き、文字の長さ（`size`）と 2 バイト目の許容範囲（`accept`）を得ます。
長さに応じて、2 バイト目が許容範囲内か、3・4 バイト目が `0x80〜0xBF`（`locb`〜`hicb`）の範囲か確かめます。外れていれば `false` です。
`size` が 2〜4 以外（不正な先頭バイト）なら `default` で `false` を返します。

### 3. 最後まで行けば正しい（565 行目）

## ここがすごい

- **SWAR（1 つのレジスタで複数データを処理）**: 64 ビット整数 1 つを「8 個のバイト」とみなし、その最上位ビットを 1 回の AND で検査しています。専用の命令（SIMD）を使わずに、並列処理と同じ効果を出しています。
- **だんだん大きく飛ばす**: いきなり 32 バイト単位にすると、短い ASCII の区間では無駄になります。8 → 16 → 32 と段階的に増やすことで、短い区間でも長い区間でも効率がよくなります。
- **`>` と `>=` の使い分け**: 529〜530 行目のコメントの通り、`len(s) > ptrSize` と「より大きい」で比べることで、飛ばした後のスライスが必ず 1 バイト以上残るようにしています。これにより、スライスの終端を越えた位置を指すポインタの補正処理が不要になります。細部まで機械語レベルで考えられています。

## まとめ

- ASCII は最上位ビットが 0 なので、8 バイトをまとめて 1 回の AND で判定できる。
- 長い区間ほど大きな単位で処理すると、よくある英語のテキストが速く処理できる。
- 比較演算子 1 つの違いが、コンパイラの生成するコードに影響することがある。
