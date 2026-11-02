---
title: "数の大きさで底の数を変える、素数判定の選び方"
description: "Miller-Rabin 法の底は、判定したい数の大きさに応じて少なくて済む組を選ぶ。小さい数は割り算で足りるので、底を返さない（nil）。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [69, 94]
function: "Integer#miller_rabin_bases"
difficulty: 3
format: 2
tags: ["数値計算", "最適化", "アルゴリズム"]
---
## ひとことで

`miller_rabin_bases` は、判定する整数の大きさに応じて、**Miller-Rabin 法で使う底（base）の組** を選ぶ内部メソッドです。
大きな数ほど多くの底が必要です。小さな数では底を使わず、割り算による判定へ任せます。
範囲が広すぎて表に載せられない数には `nil` を返します。

## コード

::: code-group

```ruby:line-numbers=69 [日本語訳]
  private def miller_rabin_bases
    # Miller-Rabin 法の計算量は O(k log^3 n) です。
    # そこで、試す底の数を減らせば計算量を下げられます。
    # 値は Wikipedia の Miller-Rabin 法のページの表による。
    i = case
    when self < 0xffff                            then
      # 小さな整数では、Miller-Rabin 法のほうが遅いことがある。
      # 0xffff には数学的な意味はない。
      return nil
  # （この行は使わない候補）2047 未満のとき 0 を選ぶ。
    when self < 1_373_653                         then 1
    when self < 9_080_191                         then 2
    when self < 25_326_001                        then 3
    when self < 3_215_031_751                     then 4
    when self < 4_759_123_141                     then 5
    when self < 1_122_004_669_633                 then 6
    when self < 2_152_302_898_747                 then 7
    when self < 3_474_749_660_383                 then 8
    when self < 341_550_071_728_321               then 9
    when self < 3_825_123_056_546_413_051         then 10
    when self < 318_665_857_834_031_151_167_461   then 11
    when self < 3_317_044_064_679_887_385_961_981 then 12
    else return nil
    end
    MILLER_RABIN_BASES[i]
  end
```

```ruby:line-numbers=69 [原文]
  private def miller_rabin_bases
    # Miller-Rabin's complexity is O(k log^3n).
    # So we can reduce the complexity by reducing the number of bases tested.
    # Using values from https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test
    i = case
    when self < 0xffff                            then
      # For small integers, Miller Rabin can be slower
      # There is no mathematical significance to 0xffff
      return nil
  # when self < 2_047                             then 0
    when self < 1_373_653                         then 1
    when self < 9_080_191                         then 2
    when self < 25_326_001                        then 3
    when self < 3_215_031_751                     then 4
    when self < 4_759_123_141                     then 5
    when self < 1_122_004_669_633                 then 6
    when self < 2_152_302_898_747                 then 7
    when self < 3_474_749_660_383                 then 8
    when self < 341_550_071_728_321               then 9
    when self < 3_825_123_056_546_413_051         then 10
    when self < 318_665_857_834_031_151_167_461   then 11
    when self < 3_317_044_064_679_887_385_961_981 then 12
    else return nil
    end
    MILLER_RABIN_BASES[i]
  end
```

:::

## 前提知識

- **底（base）**: Miller-Rabin 法で、判定に使う小さな整数です。底の選び方で、判定の確かさが変わります。
- **`case` 式（条件なし）**: `i = case` のあとに `when 条件 then 値` を並べると、最初に真になった条件の値が `i` に入ります。
- **`return nil`**: メソッドを `nil` で終わらせます。呼び出し側は「底がない」として扱えます。
- **定数（`MILLER_RABIN_BASES`）**: 変わらない値を名前で持つ、大文字で始まる変数です。
- **`0xffff`**: 16 進数の表記です。`0xffff` は 65535 のことです。

## 何をしているか

### 1. 小さすぎる数は底を使わない

::: code-group

```ruby:line-numbers=73 [日本語訳]
    i = case
    when self < 0xffff                            then
      # 小さな整数では、Miller-Rabin 法のほうが遅いことがある。
      # 0xffff には数学的な意味はない。
      return nil
```

```ruby:line-numbers=73 [原文]
    i = case
    when self < 0xffff                            then
      # For small integers, Miller Rabin can be slower
      # There is no mathematical significance to 0xffff
      return nil
```

:::

`self < 0xffff` の数は、Miller-Rabin 法を使うと割り算より遅くなることがあるので、`return nil` で「底なし」と返します。
呼び出し側（`prime?`）は、`nil` を受け取ると割り算による判定を使います。

### 2. 数の範囲ごとに、番号を決める

```ruby:line-numbers=79
    when self < 1_373_653                         then 1
    when self < 9_080_191                         then 2
    when self < 25_326_001                        then 3
    when self < 3_215_031_751                     then 4
```

`when self < 1_373_653 then 1` のように、上限ごとに番号 `i` を決めます。上限が大きくなるほど番号も大きくなります。

### 3. 番号に対応する底の組を返す

```ruby:line-numbers=92
    end
    MILLER_RABIN_BASES[i]
```

`MILLER_RABIN_BASES[i]` で、その番号に対応する底の配列を取り出します。`prime?` が後で `miller_rabin_test` に渡す値です。

## ここがすごい

### 範囲を表にして、判定の確かさを保つ

Miller-Rabin 法の底は、どの範囲の数まで正しく判定できるかが、先に数学的に分かっています。
このコードは、その上限を並べた表で「この範囲ならこの底を使う」と決めています。
読み手は、底の組を見れば、なぜその大きさで十分なのかを対応づけられます。

### 小さい数に無駄な計算をさせない

2 のような小さな数に多くの底を使うのは無駄です。
最初の条件で `return nil` にして、割り算による方法へ回すことで、計算量を抑えています。

### 上限を超えたら `nil`

表にない巨大な数は、確実に判定できる底の組が用意されていません。
`else return nil` によって、「この方法では判定しない」と正直に伝えます。

## まとめ

- 確率的な判定では、判定する数の範囲に応じて、十分な底の組を選ぶことが大切です。
- 条件つきの `case` で範囲を表すと、対応関係を 1 か所で読めます。
- 使えない場合は `nil` を返すと、呼び出し側が別の方法へ切り替えられます。
