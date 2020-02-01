
export type Rect = {
    left: number;
    right: number;
    bottom: number;
    top: number;
};

export type Manifold = Rect & {
    width: number;
    height: number;
};
