using System.Windows;

namespace ColorBlindPicker.ApplicationLayer.ViewModels;

public partial class TransparentWindow : Window
{
    public TransparentWindow()
    {
        InitializeComponent();
        Top = 0;
        Left = 0;
        Width = SystemParameters.VirtualScreenWidth;
        Height = SystemParameters.VirtualScreenHeight;
    }

    private void Window_MouseDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
    {
        DialogResult = true;
        Close();
    }
}
