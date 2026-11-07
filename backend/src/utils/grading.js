// ======================================================
// Grading Helpers
// ======================================================

export const DEFAULT_GRADE_SCALE = [
    {
        min: 70,
        letterGrade: "A",
        gradePoint: 5,
        remark: "Excellent",
    },
    {
        min: 60,
        letterGrade: "B",
        gradePoint: 4,
        remark: "Very Good",
    },
    {
        min: 50,
        letterGrade: "C",
        gradePoint: 3,
        remark: "Good",
    },
    {
        min: 45,
        letterGrade: "D",
        gradePoint: 2,
        remark: "Fair",
    },
    {
        min: 40,
        letterGrade: "E",
        gradePoint: 1,
        remark: "Pass",
    },
    {
        min: 0,
        letterGrade: "F",
        gradePoint: 0,
        remark: "Fail",
    },
];

export const getGrade = (
    score,
    gradeScale = DEFAULT_GRADE_SCALE
) => {
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

    const grade = gradeScale.find(
        (entry) => safeScore >= entry.min
    );

    return grade || gradeScale[gradeScale.length - 1];
};

export const calculateWeightedScore = (
    breakdown
) => {
    if (!Array.isArray(breakdown) || breakdown.length === 0) {
        return {
            totalScore: 0,
            totalWeight: 0,
        };
    }

    const totalWeight = breakdown.reduce(
        (sum, item) => sum + (Number(item.weight) || 0),
        0
    );

    if (totalWeight <= 0) {
        const percentages = breakdown
            .filter(
                (item) =>
                    Number(item.maxScore) > 0 &&
                    item.score !== null &&
                    item.score !== undefined
            )
            .map(
                (item) =>
                    (Number(item.score) / Number(item.maxScore)) *
                    100
            );

        const average =
            percentages.length > 0
                ? percentages.reduce(
                      (sum, value) => sum + value,
                      0
                  ) / percentages.length
                : 0;

        return {
            totalScore: Number(average.toFixed(2)),
            totalWeight: 0,
        };
    }

    const earned = breakdown.reduce((sum, item) => {
        if (
            item.score === null ||
            item.score === undefined ||
            Number(item.maxScore) <= 0
        ) {
            return sum;
        }

        return (
            sum +
            (Number(item.score) / Number(item.maxScore)) *
                (Number(item.weight) || 0)
        );
    }, 0);

    return {
        totalScore: Number(
            ((earned / totalWeight) * 100).toFixed(2)
        ),
        totalWeight,
    };
};

export const calculateGradePointAverage = (results) => {
    const valid = results.filter(
        (result) => Number(result.gradePoint) >= 0
    );

    if (valid.length === 0) {
        return 0;
    }

    return Number(
        (
            valid.reduce(
                (sum, result) =>
                    sum + Number(result.gradePoint || 0),
                0
            ) / valid.length
        ).toFixed(2)
    );
};
