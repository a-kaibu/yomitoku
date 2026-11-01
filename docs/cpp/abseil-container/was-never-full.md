---
title: 削除した場所に「墓標」が要るかを、前後の空きだけで判定する
description: オープンアドレス法では削除跡に墓標を置くのが普通。SwissTable は前後 16 スロットの空き具合を見て、墓標が不要なら本当の空きに戻す。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/container/internal/raw_hash_set.cc
lines: [735, 750]
function: WasNeverFull
difficulty: 3
tags: [ハッシュ, データ構造, ビット演算, アルゴリズム]
---

## ひとことで

オープンアドレス法のハッシュテーブルでは、要素を消したスロットを単に「空き」に戻すと、そのスロットを通り過ぎて別の場所に入った要素が見つからなくなることがあります。
そのため普通は「削除済み（墓標、tombstone）」という印を残します。
`WasNeverFull` は、**そのスロットの前後を見て「ここを通り過ぎた検索は一度もありえない」と言えるか** を判定し、言えるなら墓標なしで空きに戻せるようにする関数です。

## コード

::: code-group

```cpp:line-numbers=735 [日本語訳]
bool WasNeverFull(size_t capacity, ctrl_t* ctrl, size_t index) {
  if (is_single_group(capacity)) {
    return true;
  }
  const size_t index_before = (index - Group::kWidth) & capacity;
  const auto empty_after = Group(ctrl + index).MaskEmpty();
  const auto empty_before = Group(ctrl + index_before).MaskEmpty();

  // `it` の右と左に、空きでないスロットが何個連続しているかを数える。
  // 和が kWidth 以上なら、全部埋まったグループを見たかもしれない
  // 探索の窓が少なくとも 1 つある。
  return empty_before && empty_after &&
         static_cast<size_t>(empty_after.TrailingZeros()) +
                 empty_before.LeadingZeros() <
             Group::kWidth;
}
```

```cpp:line-numbers=735 [原文]
bool WasNeverFull(size_t capacity, ctrl_t* ctrl, size_t index) {
  if (is_single_group(capacity)) {
    return true;
  }
  const size_t index_before = (index - Group::kWidth) & capacity;
  const auto empty_after = Group(ctrl + index).MaskEmpty();
  const auto empty_before = Group(ctrl + index_before).MaskEmpty();

  // We count how many consecutive non empties we have to the right and to the
  // left of `it`. If the sum is >= kWidth then there is at least one probe
  // window that might have seen a full group.
  return empty_before && empty_after &&
         static_cast<size_t>(empty_after.TrailingZeros()) +
                 empty_before.LeadingZeros() <
             Group::kWidth;
}
```

:::

## 前提知識

- **`ctrl_t* ctrl`**: `ctrl_t`（1 バイトの制御値）の配列の先頭を指すポインタです。`ctrl + index` は「先頭から `index` 個先」を指します。
- **`Group(ptr)`**: `ptr` から始まる `Group::kWidth` 個（SSE2 なら 16 個）の制御バイトを一度に読み込む型です。
- **`MaskEmpty()`**: グループの中で「空き」のスロットに 1 が立ったビットマスクを返します。ビット 0 がグループ先頭のスロットです。
- **`TrailingZeros()` / `LeadingZeros()`**: ビットマスクの下位側 / 上位側から、0 が何個続くかを数えます。ここでは「空きでないスロットが何個続くか」の意味になります。
- **`static_cast<size_t>(...)`**: 型変換を明示する書き方です。C の `(size_t)x` より安全で、意図がはっきりします。
- **`&&`**: 論理 AND です。左が偽なら右は評価されません。ビットマスク型は `if` などで真偽値として使えるように作られています（0 なら偽）。

## 何をしているか

前提として、SwissTable の検索は **「空きスロットを含むグループに出会ったら、そこで探索を打ち切る」** というルールで動きます（グループは 16 スロットの窓です）。
したがって、あるスロットを空きに戻して困るのは、「そのスロットを含む 16 スロットの窓が、過去に一度でも全部埋まっていた」場合だけです。

### 1. 小さな表は常に OK

```cpp:line-numbers=736
  if (is_single_group(capacity)) {
    return true;
  }
```

表全体が 1 グループに収まるなら、検索は必ず 1 グループで終わります。通り過ぎる先がないので、いつでも空きに戻せます。

### 2. 前後のグループを読む

```cpp:line-numbers=739
  const size_t index_before = (index - Group::kWidth) & capacity;
  const auto empty_after = Group(ctrl + index).MaskEmpty();
  const auto empty_before = Group(ctrl + index_before).MaskEmpty();
```

`index_before` は `index` の 16 個前の位置です（`& capacity` で配列の先頭に回り込みます）。
`empty_after` は `index` から始まる 16 スロット、`empty_before` は `index` の直前で終わる 16 スロットの「空きマスク」です。

### 3. 連続して埋まっている長さを数える

```cpp:line-numbers=746
  return empty_before && empty_after &&
         static_cast<size_t>(empty_after.TrailingZeros()) +
                 empty_before.LeadingZeros() <
             Group::kWidth;
```

- `empty_after.TrailingZeros()`: `index` から右に、空きでないスロットが何個続くか。
- `empty_before.LeadingZeros()`: `index` の直前から左に、空きでないスロットが何個続くか。

この 2 つの和が 16 未満なら、`index` を含む「全部埋まった 16 スロットの窓」は存在しません。
たとえば右に 5 個、左に 7 個埋まっていれば合計 12 で、その両側には必ず空きがあります。どの 16 スロットの窓をとっても空きが入るので、検索はこの位置を通り過ぎられません。

`empty_before && empty_after` は、両方のグループに空きが 1 つ以上あることの確認です。どちらかに空きが 1 つもなければ、その 16 スロットは全部埋まっているので、それだけで「通り過ぎた検索がありえる」ことになります。

## ここがすごい

- **墓標を減らせる**: 墓標が増えると、検索は墓標を「空きでない」として通り過ぎるので遅くなり、いずれ掃除（再ハッシュ）が必要になります。この判定で多くの削除は墓標を残さずに済みます。呼び出し元の `EraseMetaOnlyLarge` は、この関数が真なら `kEmpty`、偽なら `kDeleted` を書き込みます。
- **判定がとても安い**: グループ 2 つの読み込みと、0 の個数を数える命令 2 回、足し算 1 回だけです。過去の履歴を記録しておく必要もありません。
- **「十分条件」で割り切っている**: 和が 16 以上でも実際には安全なこともありますが、そこは墓標で妥協しています。正しさを保ったまま、安くてよく当たる判定を選んでいます。

## まとめ

- オープンアドレス法の削除では、検索の「打ち切り条件」を壊さないことが大事。
- 打ち切りが「空きを含むグループで止まる」なら、前後の連続した埋まりの長さで安全性が分かる。
- leading/trailing zeros を数えると、ビットマスクから「連続した長さ」が 1 命令で得られる。
- 完全な判定でなくても、安全側に倒した安い判定は実用上とても効く。
