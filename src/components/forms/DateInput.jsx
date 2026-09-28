import TextField from "@mui/material/TextField";

function DateInput(props) {
    return (
        <TextField
            fullWidth
            margin="normal"
            variant="outlined"
            type="date"
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
            }}
            {...props}
        />
    );
}

export default DateInput;