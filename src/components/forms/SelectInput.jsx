import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

function SelectInput({
    label,
    value,
    onChange,
    options = [],
    ...props
}) {
    return (
        <TextField
            fullWidth
            margin="normal"
            variant="outlined"
            label={label}
            value={value}
            onChange={onChange}
            select
            {...props}
        >
            {options.map((option) => (
                <MenuItem
                    key={option.value}
                    value={option.value}
                >
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    );
}

export default SelectInput;