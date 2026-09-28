import TextField from "@mui/material/TextField";

function NumberInput({
    value,
    onChange,
    ...props
}) {

    function handleChange(event) {

        const inputValue = event.target.value;

        if (inputValue === "") {
            onChange(event);
            return;
        }

        if (!/^\d+$/.test(inputValue)) {
            return;
        }

        onChange(event);
    }

    return (
        <TextField
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={value}
            onChange={handleChange}
            slotProps={{
                htmlInput: {
                    min: 0,
                    step: 1,
                    inputMode: "numeric",
                },
            }}
            {...props}
        />
    );
}

export default NumberInput;