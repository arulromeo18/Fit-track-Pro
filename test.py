import tkinter as tk
import math

class PremiumCalculator:
    def __init__(self, master):
        self.master = master
        master.title("Premium Calculator")
        master.geometry("380x600")
        master.configure(bg="#1c1c1c")
        master.resizable(False, False)

        self.equation = ""
        
        # History Label
        self.history_var = tk.StringVar()
        self.history_label = tk.Label(
            master, textvariable=self.history_var, font=("Segoe UI", 16),
            bg="#1c1c1c", fg="#8e8e8e", anchor="e", padx=20, pady=10
        )
        self.history_label.pack(fill="x")

        # Display Box
        self.display_var = tk.StringVar()
        self.display_var.set("0")
        self.entry = tk.Label(
            master, textvariable=self.display_var, font=("Segoe UI", 48, "bold"),
            bg="#1c1c1c", fg="#efefef", anchor="e", padx=20
        )
        self.entry.pack(fill="x", pady=(0, 20))

        # Buttons Frame
        buttons_frame = tk.Frame(master, bg="#1c1c1c")
        buttons_frame.pack(expand=True, fill="both", padx=10, pady=10)

        # Colors
        num_color = "#333333"
        op_color = "#ff9f0a"
        func_color = "#a5a5a5"
        text_color = "#ffffff"
        func_text_color = "#000000"

        # Button Layout: (Text, Background color, Text color)
        buttons = [
            ('C', func_color, func_text_color), ('(', func_color, func_text_color), (')', func_color, func_text_color), ('/', op_color, text_color),
            ('7', num_color, text_color), ('8', num_color, text_color), ('9', num_color, text_color), ('*', op_color, text_color),
            ('4', num_color, text_color), ('5', num_color, text_color), ('6', num_color, text_color), ('-', op_color, text_color),
            ('1', num_color, text_color), ('2', num_color, text_color), ('3', num_color, text_color), ('+', op_color, text_color),
            ('0', num_color, text_color), ('.', num_color, text_color), ('^', num_color, text_color), ('=', op_color, text_color)
        ]

        row_val = 0
        col_val = 0

        for (text, bg_color, fg_color) in buttons:
            btn = tk.Button(
                buttons_frame, text=text, font=("Segoe UI", 24), bg=bg_color, fg=fg_color,
                activebackground="#666666", activeforeground="#ffffff",
                relief="flat", borderwidth=0, cursor="hand2",
                command=lambda t=text: self.on_button_click(t)
            )
            btn.grid(row=row_val, column=col_val, sticky="nsew", padx=3, pady=3)
            
            col_val += 1
            if col_val > 3:
                col_val = 0
                row_val += 1

        # Configure row/col weights so buttons stretch evenly
        for i in range(5):
            buttons_frame.rowconfigure(i, weight=1)
        for i in range(4):
            buttons_frame.columnconfigure(i, weight=1)

    def on_button_click(self, char):
        if char == 'C':
            self.equation = ""
            self.display_var.set("0")
            self.history_var.set("")
        elif char == '=':
            try:
                # Replace ^ with ** for python exponentiation evaluation
                eval_eq = self.equation.replace('^', '**')
                # Safety check (very basic)
                allowed_chars = set("0123456789+-*/.**() ")
                if not all(c in allowed_chars for c in eval_eq):
                    raise ValueError("Invalid Char")
                
                result = str(eval(eval_eq))
                
                # Format to avoid overly long decimals
                if '.' in result and len(result.split('.')[1]) > 6:
                    result = str(round(float(result), 6))
                
                self.history_var.set(self.equation + " =")
                self.display_var.set(result)
                self.equation = result
            except Exception:
                self.display_var.set("Error")
                self.equation = ""
        else:
            if self.equation == "" and char in ("*", "/", "+", "-", "^"):
                self.equation = "0" + char
            elif self.display_var.get() == "Error":
                self.equation = str(char)
            else:
                self.equation += str(char)
            
            # Format UI
            display_text = self.equation
            if len(display_text) > 12:
                display_text = "..." + display_text[-12:]
            self.display_var.set(display_text)

if __name__ == "__main__":
    root = tk.Tk()
    # Attempt to use a cleaner theme if available
    try:
        root.tk.call('tk', 'scaling', 2.0)
    except Exception:
        pass
    calc = PremiumCalculator(root)
    root.mainloop()