﻿using System.Windows;
using System.Windows.Threading;

namespace ColorBlindPicker.Windows;

public partial class PopUpCopiedWindow : Window
{
    readonly DispatcherTimer CloseWindowTimer = new()
    {
        Interval = TimeSpan.FromSeconds(1)
    };
    public PopUpCopiedWindow()
    {
        InitializeComponent();
        CloseWindowTimer.Tick += CloseWindowTimer_tick;
        CloseWindowTimer.Start();
    }

    private void CloseWindowTimer_tick(object? sender, EventArgs e)
    {
        CloseWindowTimer.Stop();
        Dispatcher.Invoke(() => Close());
    }
}
