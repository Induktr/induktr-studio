import { FC } from "react";

export type LoaderProps = {
    isLoading: boolean
    typeGhost: "row_card" | "column_card" | "grid_card"
};

export const Loader: FC<LoaderProps> = ({ isLoading, typeGhost }) => {
    return (
        <>
            {isLoading && (
                <div className="">
                    {typeGhost === "row_card" && (
                        <span></span>
                    )}
                    {typeGhost === "column_card" && (
                        <span></span>
                    )}
                    {typeGhost === "grid_card" && (
                        <span></span>
                    )}
                </div>
            )}
        </>
    )
}