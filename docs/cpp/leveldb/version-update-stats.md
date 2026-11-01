---
title: 「無駄な読み込み」の回数を数えて、読まれすぎたファイルを整理する
description: LevelDB の Get が複数ファイルを調べたとき、最初に無駄に調べたファイルの残り回数を 1 減らす関数。0 になったファイルは、読み込みの手間を減らすためにコンパクションの候補になる。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: db/version_set.cc
lines: [402, 413]
function: Version::UpdateStats
difficulty: 2
format: 2
tags: [最適化, ファイル, キャッシュ]
---

## ひとことで

LevelDB でキーを読むとき、複数のレベルのファイルを順に調べることがあります。最初に調べたファイルに目的のキーがなければ、そのファイルの読み込みは無駄（シーク 1 回分）だったことになります。
`UpdateStats` は、その無駄なシークを数える関数です。各ファイルには「無駄なシークをあと何回許すか」(`allowed_seeks`) があり、使い切ったファイルは **コンパクション（整理・統合）の候補** になります。

## コード

```cpp:line-numbers=402
bool Version::UpdateStats(const GetStats& stats) {
  FileMetaData* f = stats.seek_file;
  if (f != nullptr) {
    f->allowed_seeks--;
    if (f->allowed_seeks <= 0 && file_to_compact_ == nullptr) {
      file_to_compact_ = f;
      file_to_compact_level_ = stats.seek_file_level;
      return true;
    }
  }
  return false;
}
```

`allowed_seeks` の初期値は、ファイルが追加されるときに次のように決まります。

```cpp:line-numbers=650
      // 一定回数のシークの後に、このファイルを自動でコンパクションする
      // ようにする。次のように仮定する:
      //   (1) シーク 1 回は 10ms かかる
      //   (2) 1MB の読み書きは 10ms かかる（100MB/s）
      //   (3) 1MB のコンパクションは 25MB の入出力をする:
      //         このレベルから 1MB 読む
      //         次のレベルから 10〜12MB 読む（境界がずれることがある）
      //         次のレベルに 10〜12MB 書く
      // すると、シーク 25 回は 1MB のコンパクションと同じコストになる。
      // つまりシーク 1 回は、約 40KB のデータのコンパクションと
      // ほぼ同じコスト。少し控えめにして、約 16KB のデータごとに
      // シーク 1 回を許し、それを超えたら
      // コンパクションを始める。
      f->allowed_seeks = static_cast<int>((f->file_size / 16384U));
      if (f->allowed_seeks < 100) f->allowed_seeks = 100;
```

## 前提知識

- **シーク**: ディスク上の別の場所に移って読み始めることです。ハードディスクでは特に時間がかかります。
- **`const GetStats& stats`**: 読み込み処理が集めた統計をコピーせずに受け取ります。`seek_file` には「最初に調べて、無駄だったファイル」が、`seek_file_level` にはそのレベルが入っています。
- **`FileMetaData* f`**: ファイルの情報（番号、サイズ、キーの範囲、`allowed_seeks` など）へのポインタです。
- **`file_to_compact_`**: シークを使い切ったために整理したいファイルです。まだ決まっていなければ `nullptr` です。
- **戻り値 `bool`**: `true` なら「コンパクションを予約すべき状態になった」ことを呼び出し元に知らせます。

## 何をしているか

### 1. 無駄なシークがあったか

```cpp:line-numbers=403
  FileMetaData* f = stats.seek_file;
  if (f != nullptr) {
```
1 つのファイルだけで答えが見つかれば、`seek_file` は `nullptr` のままです。その場合は何もしません。

### 2. 残り回数を減らす

```cpp:line-numbers=405
    f->allowed_seeks--;
```
たとえば 2MB のファイルなら、初期値は `2097152 / 16384 = 128` 回です。無駄なシークが起きるたびに 1 減ります。

### 3. 使い切ったら候補にする

```cpp:line-numbers=406
    if (f->allowed_seeks <= 0 && file_to_compact_ == nullptr) {
      file_to_compact_ = f;
      file_to_compact_level_ = stats.seek_file_level;
      return true;
    }
```
0 以下になり、まだ他の候補が決まっていなければ、このファイルを `file_to_compact_` に記録して `true` を返します。呼び出し元はバックグラウンドのコンパクションを予約します。
次のコンパクションでこのファイルが下のレベルに統合されれば、同じキーを探すときに調べるファイルが 1 つ減ります。

## ここがすごい

- **読み込みのパターンから整理を決める**: ふつうのコンパクションは「容量があふれたら」行われます。これに加えて、「よく読まれるのに無駄が多いファイル」も整理の対象にすることで、読み込みが多い使い方でも性能が落ちにくくなります。
- **回数の根拠をコメントに書いている**: 初期値のコメントは、「シーク 1 回 10ms」「1MB の読み書き 10ms」「1MB のコンパクションで 25MB の入出力」という仮定から、シーク 1 回が 40KB 分のコンパクションと同じコストだと計算しています。そのうえで少し控えめに 16KB ごとに 1 回としています。魔法の数字に見える値に、計算の過程が付いています。
- **小さなファイルにも最低 100 回**: 小さいファイルがすぐにコンパクションされすぎないよう、下限を設けています。
- **処理は数えるだけ**: 読み込みのたびに呼ばれるので、中身は引き算と比較だけです。重いコンパクションはバックグラウンドに任せています。

## まとめ

- 書き込み量だけでなく、読み込みの無駄も整理のきっかけにできる。
- しきい値は、コストの見積もりから計算し、その過程をコメントに残す。
- 頻繁に通る経路では数を数えるだけにして、重い処理は後回しにする。
