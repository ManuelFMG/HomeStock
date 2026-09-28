import TextField from "@mui/material/TextField";

function PriceInput(props) {
    return (
        <TextField
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            slotProps={{
                htmlInput: {
                    min: 0,
                    step: 0.01,
                },
            }}
            {...props}
        />
    );
}

export default PriceInput;