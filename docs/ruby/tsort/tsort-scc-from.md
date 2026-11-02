---
title: "グラフの強連結成分を 1 回の走査で見つける"
description: "TSort の強連結成分の探索は、ノードに番号を振って戻り先の最小番号を覚えるだけで、循環する部分をまとめて取り出す。"
language: ruby
project: "Ruby tsort (標準ライブラリ)"
repo: https://github.com/ruby/tsort
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "af67b565a5a0006a35220253d50e178bc63e7cca"
file: lib/tsort.rb
lines: [413, 440]
function: "TSort.each_strongly_connected_component_from"
difficulty: 3
format: 2
tags: ["アルゴリズム", "データ構造", "再帰"]
---
## ひとことで

`TSort.each_strongly_connected_component_from` は、グラフの中で **互いにたどり着ける頂点の集まり（強連結成分）** を見つけて、1 つずつ順に渡すメソッドです。
循環している頂点は同じ成分にまとまり、循環のない頂点は 1 つだけの成分になります。
1 回の深さ優先探索で、すべての成分を見つけられます（Tarjan のアルゴリズム）。

## コード

::: code-group

```ruby:line-numbers=413 [日本語訳]
  def self.each_strongly_connected_component_from(node, each_child, id_map={}, stack=[]) # 強連結成分ごとに、ノードの配列を渡すブロック
    return to_enum(__method__, node, each_child, id_map, stack) unless block_given?

    minimum_id = node_id = id_map[node] = id_map.size
    stack_length = stack.length
    stack << node

    each_child.call(node) {|child|
      if id_map.include? child
        child_id = id_map[child]
        minimum_id = child_id if child_id && child_id < minimum_id
      else
        sub_minimum_id =
          each_strongly_connected_component_from(child, each_child, id_map, stack) {|c|
            yield c
          }
        minimum_id = sub_minimum_id if sub_minimum_id < minimum_id
      end
    }

    if node_id == minimum_id
      component = stack.slice!(stack_length .. -1)
      component.each {|n| id_map[n] = nil}
      yield component
    end

    minimum_id
  end
```

```ruby:line-numbers=413 [原文]
  def self.each_strongly_connected_component_from(node, each_child, id_map={}, stack=[]) # :yields: nodes
    return to_enum(__method__, node, each_child, id_map, stack) unless block_given?

    minimum_id = node_id = id_map[node] = id_map.size
    stack_length = stack.length
    stack << node

    each_child.call(node) {|child|
      if id_map.include? child
        child_id = id_map[child]
        minimum_id = child_id if child_id && child_id < minimum_id
      else
        sub_minimum_id =
          each_strongly_connected_component_from(child, each_child, id_map, stack) {|c|
            yield c
          }
        minimum_id = sub_minimum_id if sub_minimum_id < minimum_id
      end
    }

    if node_id == minimum_id
      component = stack.slice!(stack_length .. -1)
      component.each {|n| id_map[n] = nil}
      yield component
    end

    minimum_id
  end
```

:::

## 前提知識

- **グラフ**: 頂点（ノード）と、頂点どうしをつなぐ矢印（辺）の集まりです。
- **強連結成分**: 成分の中のどの頂点からも、ほかのどの頂点へもたどり着ける頂点の集まりです。
- **深さ優先探索**: 1 本の道を奥まで進んでから、戻って別の道を進む探索です。再帰で書かれることが多いです。
- **`each_child`**: 頂点から出る矢印の先（子）を、順に渡してくれる呼び出し可能なオブジェクトです。
- **`id_map`**: 頂点に振った番号の表です。番号は、探索で訪れた順に付けられます。
- **`stack.slice!`**: 配列の後ろの一部を切り取って取り出します。

## 何をしているか

### 1. 訪れた頂点に番号を付け、スタックに積む

```ruby:line-numbers=414
    return to_enum(__method__, node, each_child, id_map, stack) unless block_given?

    minimum_id = node_id = id_map[node] = id_map.size
    stack_length = stack.length
    stack << node
```

まだ訪れていない頂点は、今の `id_map.size` を番号にして登録します。その頂点は `stack` に積んでおき、あとで同じ成分の仲間かを判断するために使います。

### 2. 子の頂点を調べ、戻り先の最小番号を覚える

```ruby:line-numbers=420
    each_child.call(node) {|child|
      if id_map.include? child
        child_id = id_map[child]
        minimum_id = child_id if child_id && child_id < minimum_id
      else
        sub_minimum_id =
          each_strongly_connected_component_from(child, each_child, id_map, stack) {|c|
            yield c
          }
        minimum_id = sub_minimum_id if sub_minimum_id < minimum_id
      end
    }
```

子の頂点がすでに番号を持っていれば、その番号と比べて、`minimum_id` を小さい方に更新します。
まだ番号がなければ、子を再帰で探索し、子の中で届いた最小の番号を受け取ります。

### 3. 自分の番号が最小なら、成分ができあがっている

```ruby:line-numbers=433
    if node_id == minimum_id
      component = stack.slice!(stack_length .. -1)
      component.each {|n| id_map[n] = nil}
      yield component
    end
```

`node_id == minimum_id` なら、この頂点より前には戻れない（循環の根である）ので、`stack` の中の自分より後ろにある頂点が、ひとまとまりの成分です。
その頂点たちの番号は `nil` にして「完了」を示し、`yield` で渡します。

### 4. 最小の番号を返す

```ruby:line-numbers=439
    minimum_id
```

親の頂点は、この戻り値と自分の `minimum_id` を比べて、さらに戻り先の番号を知ります。

## ここがすごい

### 1 回の探索で、すべての成分を見つける

成分を見つけるために、頂点の組み合わせごとに「たどり着けるか」を調べると、時間がかかります。
このコードは、番号と最小番号の情報を探索中に積み上げるだけで、探索の終わりには全部の成分が決まっています。

### 番号を `nil` にして完了を表す

成分が決まった頂点は、`id_map` の値を `nil` にします。
あとの探索で同じ頂点に出会っても、`child_id && ...` で無視されます。余分な印を別に持つ必要がありません。

### 関数の中で関数を呼ぶ形で、部品として使える

成分を 1 つ見つけるたびに `yield` で渡すので、利用者は結果を集めても、すぐ処理しても構いません。
このメソッドは、クラスの中の `tsort_each_child` と組み合わせると、どんな依存関係のグラフでも使えます。

## まとめ

- 循環を見つけるときは、訪れた順番の番号と、戻れる最小の番号を組み合わせます。
- 完了した頂点に印を付けると、探索の途中でも二重に扱わずに済みます。
- 結果を `yield` で 1 つずつ渡すと、大きなグラフでも結果を全部覚えずに処理できます。
