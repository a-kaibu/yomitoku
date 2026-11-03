---
title: "有向グラフの頂点を、矢印の向きに沿って並べる"
description: "digraph_utils:topsort/1 は、有向グラフの頂点を、辺の向きを守る順番に並べる。深さ優先探索の逆後順を使い、循環があれば false を返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1999-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/digraph_utils.erl
lines: [220, 225]
function: "digraph_utils:topsort/1"
difficulty: 3
format: 2
tags: ["データ構造", "アルゴリズム"]
---
## ひとことで

`digraph_utils:topsort/1` は、有向グラフの頂点を、トポロジカル順序（辺の向きを守る並び）に並べます。
「A から B へ辺がある」なら、A は B より前に並びます。この順序は、依存関係の解決や、ビルドの順番を決めるときに使われます。循環があると、この順序は作れないので `false` を返します。

## コード

```erlang:line-numbers=220
topsort(G) ->
    L = revpostorder(G),
    case length(forest(G, fun in/3, L)) =:= length(digraph:vertices(G)) of
	true  -> L;
	false -> false
    end.
```

## 前提知識

- **有向グラフ**: 頂点と、向きのある辺（矢印）からできた図形です。`digraph` モジュールで表します。
- **トポロジカル順序**: 辺の向きどおりに並べた頂点の列です。循環がないグラフでだけ作れます。
- **深さ優先探索（DFS）**: 頂点から行けるところまで掘り下げてから戻る探索です。
- **後順（postorder）**: 子をすべて訪れたあとに、その頂点を記録する順番です。
- **森（forest）**: DFS で作った木の集まりです。
- **`length/1` の比較**: 木の数と頂点の数を比べて、循環を見分けます。

## 何をしているか

### 1. 逆後順を求める

```erlang:line-numbers=221
    L = revpostorder(G),
```

`revpostorder/1` で、頂点を DFS の後順の逆に並べた列 `L` を作ります。後順の逆は、辺の向きに沿った順番になるのが基本的な考え方です。

### 2. 循環がないかを確かめる

```erlang:line-numbers=222
    case length(forest(G, fun in/3, L)) =:= length(digraph:vertices(G)) of
	true  -> L;
	false -> false
```

`forest/3` で、その列の順に DFS の森を作ります。森の木の数が、頂点の数と一致すれば、循環はないと判断して `L` を返します。一致しなければ、循環があるので `false` を返します。

## ここがすごい

### 後順の逆で、並びを一度に作る

トポロジカル順序を素直に作るには、入次数（入ってくる辺の数）が 0 の頂点を探して取り除く方法もあります。しかし、この関数は DFS を 1 回行うだけで、後順の逆から並びを作ります。
辺の向きに沿って、後から終わる頂点が前に来る、という DFS の性質を使っています。

### 循環の判定を、森の数で済ませる

循環があるかどうかを、別のアルゴリズムで調べるのではありません。作った並びで森を組み直し、木の数が頂点の数と一致するかを確かめます。
並びが正しければ、各頂点が 1 つの木になります。木の数が足りなければ、どこかで矛盾が起きていると分かります。

## まとめ

- 依存関係の順序は、DFS の逆後順で 1 回の走査で作れます。
- 循環の有無は、作った並びで組み直した森の数で確かめられます。
- 循環があるときに `false` を返すと、呼び出し側が失敗を簡単に判断できます。
