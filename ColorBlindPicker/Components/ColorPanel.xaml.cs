using ColorBlindPicker.ApplicationLayer.Models;
using System.Windows;
using System.Windows.Controls;

namespace ColorBlindPicker.Components
{
    /// <summary>
    /// Interaction logic for ColorPanel.xaml
    /// </summary>
    public partial class ColorPanel : UserControl
    {
        public event EventHandler DeleteCommand = delegate { };


        ColorModel viewModel = new();
        public ColorPanel() => InitializeComponent();
        private void UserControl_Loaded(object sender, RoutedEventArgs e) => viewModel = (ColorModel)DataContext;

        private void CopyButton_Click(object sender, RoutedEventArgs e)
        {
            Clipboard.SetText(viewModel.Hex);
        }

        private void DeleteButton_Click(object sender, RoutedEventArgs e)
        {
            DeleteCommand.Invoke(sender, e);
        }
    }
}
