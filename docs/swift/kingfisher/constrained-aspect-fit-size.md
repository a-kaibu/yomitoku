---
title: "縦横比を保って、枠に収まる最大の大きさを求める"
description: "画像などの元の大きさを、縦横比を保ったまま、指定した枠に収まるように縮める計算。枠の高さに合わせたときに幅がはみ出すかで、どちらの辺を基準にするかを決める。"
language: swift
project: "Kingfisher"
repo: https://github.com/onevcat/Kingfisher
license: MIT
copyright: "Copyright (c) 2019 Wei Wang <onevcat@gmail.com>"
commit: "7406a99571034568b6ca4ba875c01842607e03d9"
file: Sources/Utility/SizeExtensions.swift
lines: [53, 59]
function: "CGSize.constrained(_:)"
difficulty: 1
tags: [数値計算, 型システム, API設計]
format: 2
---
## ひとことで

画像を表示枠に入れるとき、縦横比を崩さずに、枠に収まる最大の大きさにしたいことがあります。これは **aspect fit** と呼ばれる計算です。
`constrained(_:)` は、元の大きさ（`self`）の縦横比を保ったまま、枠（`size`）に収まる大きさを返します。Kingfisher では、画像を表示するときの大きさを決めるのに使われます。

## コード

```swift:line-numbers=53
    public func constrained(_ size: CGSize) -> CGSize {
        let aspectWidth = round(aspectRatio * size.height)
        let aspectHeight = round(size.width / aspectRatio)
        
        return aspectWidth > size.width ?
            CGSize(width: size.width, height: aspectHeight) :
            CGSize(width: aspectWidth, height: size.height)
```

## 前提知識

- **縦横比（aspect ratio）**: 幅を高さで割った値です。`aspectRatio` は、この比率を表します。
- **`round`**: 小数を最も近い整数に丸める関数です。画素単位の大きさにするために使います。
- **aspect fit と aspect fill**: fit は枠に全部が収まるように縮めます。fill は枠を全部覆うように拡大します。どちらも縦横比は保ちます。

## 何をしているか

### 1. 枠の高さに合わせたときの幅を求める

枠の高さに合わせて、縦横比を保った幅を計算します。これが枠の幅より大きければ、幅がはみ出します。

```swift:line-numbers=54
        let aspectWidth = round(aspectRatio * size.height)
        let aspectHeight = round(size.width / aspectRatio)
```
### 2. はみ出すなら幅に合わせ、そうでなければ高さに合わせる

幅がはみ出す場合は、幅を枠の幅に合わせて、高さを縦横比から求めます。はみ出さない場合は、高さを枠の高さに合わせて、そのときの幅を使います。どちらの場合も、縦横比は保たれます。

```swift:line-numbers=57
        return aspectWidth > size.width ?
            CGSize(width: size.width, height: aspectHeight) :
            CGSize(width: aspectWidth, height: size.height)
```
例として、1600 × 900 の画像（縦横比は約 1.78）を、800 × 800 の枠に入れます。高さに合わせると、幅は約 1422 になり、800 を超えます。そこで幅に合わせて、高さは `800 ÷ 1.78 ≈ 450` になります。結果は 800 × 450 です。

## ここがすごい

- **比べるのは 1 回だけ**: どちらの辺を基準にするかは、「高さに合わせたときの幅が枠を超えるか」の 1 回の比較で決まります。
- **同じ形の式を、比較の向きを変えて使う**: `filling(_:)` は、同じ計算で比較だけを逆にしています。fit と fill の違いが、読むと 1 行で分かります。
- **`round` で画素の大きさにする**: 小数のままでは、画素の境界で半端になります。丸めることで、整数の大きさとして使えます。

## まとめ

- 縦横比を保って枠に収めるには、高さに合わせたときの幅が枠を超えるかで基準を決める。
- 超えるなら幅に合わせ、超えないなら高さに合わせる。
- 比較の向きを逆にすると、枠を覆う fill の計算になる。
